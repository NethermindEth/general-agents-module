import { providers, Contract, BigNumber, ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { MKR_TOKEN_ABI, TOKEN_ABI, SUBGRAPH_URL } from "./constants";
import { restApis } from "./config";
import {
  getChainByChainId,
  getNativeTokenByChainId,
  getNativeTokenPrice,
  getNativeTokenSymbolByChainId,
  getTokenPriceUrl,
  getTopTokenHoldersUrl,
  getUniswapPrice,
  uniswapV3Query,
} from "./helper";
import fetch from "node-fetch";

export default class TokenInfoFetcher {
  provider: providers.JsonRpcProvider;
  private cache: LRU<string, BigNumber | number | string>;
  private tokensPriceCache: LRU<string, number>;
  private tokenContract: Contract;
  latestBlockNumber: number;

  constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber | number | string>({
      max: 10000,
    });
    this.tokenContract = new Contract("", new Interface(TOKEN_ABI), this.provider);
    this.tokensPriceCache = new LRU<string, number>({ max: 10000 });
    this.latestBlockNumber = 0;
  }

  public async getBalance(block: number, protocolAddress: string, tokenAddress: string): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `balance-${protocolAddress}-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = await token.balanceOf(protocolAddress, {
      blockTag: block,
    });

    this.cache.set(key, balance);

    return balance;
  }

  public async getTotalSupply(block: number, tokenAddress: string): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `totalSupply-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const totalSupply: BigNumber = await token.totalSupply({
      blockTag: block,
    });

    this.cache.set(key, totalSupply);

    return totalSupply;
  }

  public async getSymbolOrName(chainId: number, block: number | string, tokenAddress: string): Promise<string> {
    const token = this.tokenContract.attach(tokenAddress);
    const key: string = `symbol-${chainId}-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as string;

    let symbol: string;
    if (tokenAddress === "native") {
      symbol = getNativeTokenSymbolByChainId(chainId);
    } else {
      try {
        symbol = await token.symbol({
          blockTag: block,
        });
        this.cache.set(key, symbol);
      } catch {
        const makerLikeToken = new Contract(tokenAddress, new Interface(MKR_TOKEN_ABI), this.provider);
        try {
          symbol = ethers.utils.parseBytes32String(
            await makerLikeToken.symbol({
              blockTag: block,
            })
          );
          this.cache.set(key, symbol);
        } catch {
          try {
            symbol = await this.getName(block, tokenAddress);
          } catch {
            symbol = "Not Found";
          }
        }
      }
    }

    this.cache.set(key, symbol);
    return symbol;
  }

  public async getName(block: number | string, tokenAddress: string): Promise<string> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `name-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as string;

    let name: string;
    try {
      name = await token.name({
        blockTag: block,
      });
    } catch {
      name = "Not Found";
    }
    this.cache.set(key, name);
    return name;
  }

  async getDecimals(block: number | string, tokenAddress: string): Promise<number> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `decimals-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as number;

    const decimals: number = await token.decimals({
      blockTag: block,
    });

    this.cache.set(key, decimals);

    return decimals;
  }

  public async getValueInUsd(block: number, chainId: number, amount: string, token: string): Promise<number> {
    let response, usdPrice;

    const key = `usdPrice-${token}-${block}`;
    if (this.tokensPriceCache.has(key)) {
      usdPrice = this.tokensPriceCache.get(key);
    } else {
      if (token === "native") {
        const chain = getNativeTokenByChainId(chainId);

        let retries = 3;
        while (retries > 0) {
          try {
            response = (await (await fetch(getNativeTokenPrice(chain))).json()) as any;
            break;
          } catch {
            retries--;
          }
        }
        if (!response || !response[getNativeTokenByChainId(chainId)]) {
          if (this.tokensPriceCache.has(`usdPrice-${token}-${block - 1}`)) {
            usdPrice = this.tokensPriceCache.get(`usdPrice-${token}-${block - 1}`);
          } else return 0;
        } else {
          usdPrice = response[getNativeTokenByChainId(chainId)].usd;
        }
      } else {
        const chain = getChainByChainId(chainId);
        try {
          response = (await (await fetch(getTokenPriceUrl(chain, token))).json()) as any;
          if (response && response[token]) {
            usdPrice = response[token].usd;
          } else {
            throw new Error("Error: Can't fetch USD price on CoinGecko");
          }
        } catch {
          if (chainId === 10 || chainId === 42161) return 0; // Moralis API is not available on Optimism & Arbitrum
          try {
            usdPrice = await getUniswapPrice(chainId, token);
            if (!usdPrice) return 0;
          } catch {
            return 0;
          }
        }
      }
      this.tokensPriceCache.set(`usdPrice-${token}-${block}`, usdPrice);
    }

    let tokenAmount;
    if (token === "native") {
      tokenAmount = ethers.utils.formatEther(amount);
    } else {
      const decimals = await this.getDecimals(block, token);
      tokenAmount = ethers.utils.formatUnits(amount, decimals);
    }

    return Number(tokenAmount) * usdPrice;
  }

  public async getHolders(tokenOrPool: string, tag: string): Promise<string[]> {
    let holders: string[] = [];

    if (tokenOrPool !== "native") {
      let response;
      if (tag.startsWith("Uniswap V3")) {
        try {
          response = (await (
            await fetch(SUBGRAPH_URL, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ query: uniswapV3Query(tokenOrPool) }),
            })
          ).json()) as any;
          response.data.positions.forEach((position: { owner: string }) => holders.push(position.owner));
        } catch {}
      } else {
        try {
          response = (await (await fetch(getTopTokenHoldersUrl(tokenOrPool, restApis["ethplorerKey"]))).json()) as any;
          response.holders.forEach((holder: { address: string; balance: number; share: number }) =>
            holders.push(holder.address)
          );
        } catch {}
      }
    }
    return holders;
  }
}
