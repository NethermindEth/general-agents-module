import { ethers, TransactionEvent, getAlerts, Alert, AlertsResponse } from "forta-agent";
import LRU from "lru-cache";
import fetch from "node-fetch";
import AddressesExtractor from "./helpers/addresses.extractor";
import {
  ERC20_TRANSFER_EVENT,
  PREPARATION_BOT,
  WRAPPED_NATIVE_TOKEN_EVENTS,
  ZERO,
  MAX_USD_VALUE,
  SAFE_TAGS,
} from "./helpers/constants";
import TokenInfoFetcher from "./helpers/token.info.fetcher";
import { toChecksumAddress } from "..";
import { getWebsiteAndTwitter } from "./helpers/urlAndTwitter";

const wrappedNativeTokens: Record<number, string> = {
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  10: "0x4200000000000000000000000000000000000006",
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
};

const safeTokensPerChain: Record<number, string[]> = {
  1: [
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  ],
  10: [
    "0x4200000000000000000000000000000000000042", // OP
    "0x4200000000000000000000000000000000000006", // WETH
    "0x7f5c764cbc14f9669b88837ca1490cca17c31607", // USDC
    "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
    "0x68f180fcCe6836688e9084f035309E29Bf0A2095", // WBTC
  ],
  56: [
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
    "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
    "0x55d398326f99059fF775485246999027B3197955", // USDT
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
    "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTC
  ],
  137: [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
    "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC
  ],
  250: [
    "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83", // WFTM
    "0x74b23882a30290451A17c44f4F05243b6b58C76d", // WETH
    "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", // USDC
    "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E", // DAI
  ],
  42161: [
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
    "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", // WBTC
  ],
  43114: [
    "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // WAVAX
    "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", // WETH
    "0x152b9d0FdC40C096757F570A51E494bd4b943E50", // BTC
    "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // USDT
    "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
  ],
};

const safeTagsPerChain: Record<number, string[]> = {
  1: [
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  ],
  10: ["UniswapV3Pool", "KS2-RT"],
  56: [
    "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
    "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // ETH
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC
    "0x55d398326f99059fF775485246999027B3197955", // USDT
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
    "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTC
  ],
  137: ["UniswapV3Pool", "UNI-V2"],
  250: ["spLP"],
  42161: ["SLP"],
  43114: [
    "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", // WAVAX
    "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", // WETH
    "0x152b9d0FdC40C096757F570A51E494bd4b943E50", // BTC
    "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // USDT
    "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
  ],
};

interface apiKeys {
  ethplorerApiKey?: string;
  moralisApiKey?: string;
  etherscanApiKey?: string;
  optimisticEtherscanApiKey?: string;
  bscscanApiKey?: string;
  polygonscanApiKey?: string;
  fantomscanApiKey?: string;
  arbiscanApiKey?: string;
  snowtraceApiKey?: string;
}

const restApis: Record<string, string> = {
  ethplorerKey: "",
  moralisKey: "",
};

interface etherscanApisInterface {
  [key: number]: {
    key: string;
    urlContractName: string;
    urlContractCreation: string;
  };
}

const etherscanApis: etherscanApisInterface = {
  1: {
    key: "",
    urlContractName: "https://api.etherscan.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.etherscan.io/api?module=contract&action=getcontractcreation",
  },
  10: {
    key: "",
    urlContractName: "https://api-optimistic.etherscan.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api-optimistic.etherscan.io/api?module=contract&action=getcontractcreation",
  },
  56: {
    key: "",
    urlContractName: "https://api.bscscan.com/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.bscscan.com/api?module=contract&action=getcontractcreation",
  },
  137: {
    key: "",
    urlContractName: "https://api.polygonscan.com/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.polygonscan.com/api?module=contract&action=getcontractcreation",
  },
  250: {
    key: "",
    urlContractName: "https://api.ftmscan.com/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.ftmscan.com/api?module=contract&action=getcontractcreation",
  },
  42161: {
    key: "",
    urlContractName: "https://api.arbiscan.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.arbiscan.io/api?module=contract&action=getcontractcreation",
  },
  43114: {
    key: "",
    urlContractName: "https://api.snowtrace.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.snowtrace.io/api?module=contract&action=getcontractcreation",
  },
};

const urlAndTwitterFetcher = (protocols: string[][], tag: string): string[] => {
  const correctProtocols = protocols
    .filter((protocol) => {
      const tagParts: string[] = tag.split(/[-.: ]/);
      const protocolParts: string[] = protocol[0].split("-");
      return (
        protocol[0] === tagParts[0].toLowerCase() ||
        protocolParts[0] === tagParts[0].toLowerCase() ||
        (tagParts[0].length > 3 && protocolParts[0].startsWith(tagParts[0].toLowerCase()))
      );
    })
    .sort();

  return getWebsiteAndTwitter(tag, correctProtocols);
};

const fetchFortaLabel = async (address: string, chainId: number): Promise<string> => {
  if (![1, 137, 250].includes(chainId)) return "";

  const LABELS_SOURCE = chainId === 1 ? "etherscan" : chainId === 137 ? "polygon" : "fantom";

  const url = `https://api.forta.network/labels/state?entities=${address}&sourceIds=${LABELS_SOURCE}-tags&limit=1`;
  let response;

  try {
    response = await (await fetch(url)).json();
    return response.events[0]["label"]["label"];
  } catch {
    return "";
  }
};

// Helper function to fetch implementation address
const getStorageFallback = async (
  provider: ethers.providers.JsonRpcProvider,
  address: string,
  blockNumber: number
): Promise<string> => {
  let storage = "0x0000000000000000000000000000000000000000000000000000000000000000"; // default: empty slot

  // Check slots of the hashes: 1) "eip1967.proxy.implementation", 2) "org.zeppelinos.proxy.implementation"
  for (const slot of [
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
    "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3",
  ]) {
    storage = await provider.getStorageAt(address, slot, blockNumber);

    const padded = storage.replace(/^0x/, "").padStart(64, "0");
    storage = "0x" + padded;

    if (!ethers.BigNumber.from(storage.replace(/^(0x)?/, "0x")).eq(ethers.BigNumber.from(0))) {
      break;
    }
  }
  return storage;
};

/* 
  @OpenZeppelin's getImplementationAddress method simplified and using ethers.BigNumber instead of BigInt
  Original version here: https://github.com/OpenZeppelin/openzeppelin-upgrades/blob/master/packages/core/src/eip-1967.ts#L20
*/
export const getImplementationAddress = async (
  provider: ethers.providers.JsonRpcProvider,
  address: string,
  blockNumber: number
) => {
  let storage = "0x0000000000000000000000000000000000000000000000000000000000000000"; // default: empty slot
  storage = await getStorageFallback(provider, address, blockNumber);

  if (ethers.BigNumber.from(storage.replace(/^(0x)?/, "0x")).eq(ethers.BigNumber.from(0))) {
    return undefined;
  }

  //Helper function
  function parseAddress(addressString: string): string | undefined {
    const buf = Buffer.from(addressString.replace(/^0x/, ""), "hex");
    if (!buf.subarray(0, 12).equals(Buffer.alloc(12, 0))) {
      return undefined;
    }
    const address = "0x" + buf.toString("hex", 12, 32); // grab the last 20 bytes
    return toChecksumAddress(address);
  }

  //Helper function
  function parseAddressFromStorage(storage: string): string {
    const address = parseAddress(storage);
    if (address === undefined) {
      throw new Error(`Value in storage is not an address (${storage})`);
    }
    return address;
  }

  return parseAddressFromStorage(storage);
};

async function getContractName(
  provider: ethers.providers.JsonRpcProvider,
  address: string,
  chainId: number,
  blockNumber: number
) {
  const { urlContractName, key }: { urlContractName: string; key: string } = etherscanApis[chainId];
  let url = `${urlContractName}&address=${address}&apikey=${key}`;
  let result;
  try {
    result = (await (await fetch(url)).json()) as any;
    if (result.message.startsWith("NOTOK")) {
      console.log(`block explorer error occurred; skipping contract name check for ${address}`);
      return "Not Found";
    }
    let contractName = result.result[0].ContractName;
    if (contractName === "") {
      return "Not Found";
    }

    if (contractName.toLowerCase().includes("proxy")) {
      let implementation: string | undefined;
      implementation = await getImplementationAddress(provider, address, blockNumber);

      if (implementation !== undefined) {
        url = `${urlContractName}&address=${implementation}&apikey=${key}`;
        result = (await (await fetch(url)).json()) as any;

        if (result.message.startsWith("NOTOK")) {
          console.log(
            `block explorer error occurred; skipping contract name check for implementation address at ${address}`
          );
          return "Not Found";
        }

        contractName = result.result[0].ContractName;
        if (contractName === "") {
          return "Not Found";
        }

        return contractName;
      } else return "Not Found";
    } else return contractName;
  } catch {
    return "Not Found";
  }
}

const getContractCreator = async (address: string, chainId: number) => {
  const { urlContractCreation, key }: { urlContractCreation: string; key: string } = etherscanApis[chainId];
  const url = `${urlContractCreation}&contractaddresses=${address}&apikey=${key}`;

  let result;
  try {
    result = (await (await fetch(url)).json()) as any;
    if (result.message.startsWith("NOTOK")) {
      console.log(`block explorer error occured; skipping contract creator check for ${address}`);
      return "";
    }
    return result.result[0].contractCreator;
  } catch {
    return "";
  }
};

export default class VictimIdentifier extends TokenInfoFetcher {
  addressesExtractor: AddressesExtractor;
  private init: boolean;
  private protocols: string[][];
  private victimOccurrences: Record<string, number>;
  private maxOccurrences: number;
  private isContractCache: LRU<string, boolean>;

  constructor(provider: ethers.providers.JsonRpcProvider, apiKeys: apiKeys) {
    super(provider, apiKeys);

    // Extract the keys or set default values
    const {
      ethplorerApiKey = "freekey",
      moralisApiKey = "",
      etherscanApiKey = "YourApiKeyToken",
      optimisticEtherscanApiKey = "YourApiKeyToken",
      bscscanApiKey = "YourApiKeyToken",
      polygonscanApiKey = "YourApiKeyToken",
      fantomscanApiKey = "YourApiKeyToken",
      arbiscanApiKey = "YourApiKeyToken",
      snowtraceApiKey = "YourApiKeyToken",
    } = apiKeys;

    // Set the keys
    restApis["ethplorerKey"] = ethplorerApiKey;
    restApis["moralisKey"] = moralisApiKey;
    etherscanApis[1].key = etherscanApiKey;
    etherscanApis[10].key = optimisticEtherscanApiKey;
    etherscanApis[56].key = bscscanApiKey;
    etherscanApis[137].key = polygonscanApiKey;
    etherscanApis[250].key = fantomscanApiKey;
    etherscanApis[42161].key = arbiscanApiKey;
    etherscanApis[43114].key = snowtraceApiKey;

    this.addressesExtractor = new AddressesExtractor(provider);
    this.init = false;
    this.protocols = [];
    this.getProtocols();
    this.victimOccurrences = {};
    this.maxOccurrences = 0;
    this.isContractCache = new LRU<string, boolean>({ max: 10000 });
  }

  private getProtocols = async () => {
    const response = (await (await fetch("https://api.llama.fi/protocols")).json()) as any;
    response.forEach((protocol: any) => {
      this.protocols.push([protocol.slug, protocol.url, protocol.twitter]);
    });
  };

  private getExploitationStageVictims = async (txEvent: TransactionEvent) => {
    const balanceChangesMap: Map<string, Record<string, ethers.BigNumber>> = new Map();

    const erc20TransferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT).filter((event) => !event.args.value.eq(ZERO));
    let events = erc20TransferEvents;
    if (txEvent.network in wrappedNativeTokens) {
      const wrappedTokenEvents = txEvent
        .filterLog(WRAPPED_NATIVE_TOKEN_EVENTS, wrappedNativeTokens[txEvent.network])
        .filter((event) => !event.args.value.eq(ZERO));
      events = events.concat(wrappedTokenEvents);
    }

    await Promise.all(
      events.map(async (event) => {
        const token = event.address;
        let { from, to, value } = event.args;
        if (!from) {
          from = wrappedNativeTokens[txEvent.network];
        } else {
          from = ethers.utils.getAddress(from);
        }

        // Update the balances map for 'from'
        if (balanceChangesMap.has(from)) {
          let currentEntry = balanceChangesMap.get(from);
          currentEntry![token] = (currentEntry![token] || ZERO).sub(value);
          balanceChangesMap.set(from, currentEntry!);
        } else {
          balanceChangesMap.set(from, { [token]: value.mul(-1) });
        }

        if (!to) {
          to = wrappedNativeTokens[txEvent.network];
        } else {
          to = ethers.utils.getAddress(to);
        }

        if (balanceChangesMap.has(to)) {
          let currentEntry = balanceChangesMap.get(to);
          currentEntry![token] = (currentEntry![token] || ZERO).add(value);
          balanceChangesMap.set(to, currentEntry!);
        } else {
          balanceChangesMap.set(to, { [token]: value });
        }
      })
    );

    if (txEvent.traces.length > 0) {
      await Promise.all(
        txEvent.traces.map(async (trace) => {
          let { from, to, value, callType } = trace.action;

          if (value && value !== "0x0" && callType === "call") {
            from = ethers.utils.getAddress(from);
            to = ethers.utils.getAddress(to);
            const bnValue = ethers.BigNumber.from(value);

            // Update the native token balance for the from address
            if (balanceChangesMap.has(from)) {
              let currentEntry = balanceChangesMap.get(from);
              currentEntry!["native"] = (currentEntry!["native"] || ZERO).sub(bnValue);
              balanceChangesMap.set(from, currentEntry!);
            } else {
              balanceChangesMap.set(from, { ["native"]: bnValue.mul(-1) });
            }
            // Update the native token balance for the to address
            if (balanceChangesMap.has(to)) {
              let currentEntry = balanceChangesMap.get(to);
              currentEntry!["native"] = (currentEntry!["native"] || ZERO).add(bnValue);
              balanceChangesMap.set(to, currentEntry!);
            } else {
              balanceChangesMap.set(to, { ["native"]: bnValue });
            }
          }
        })
      );
    } else {
      if (txEvent.to && txEvent.transaction.value !== "0x0") {
        const from = ethers.utils.getAddress(txEvent.from);
        const to = ethers.utils.getAddress(txEvent.to);
        const bnValue = ethers.BigNumber.from(txEvent.transaction.value);

        // Update the native token balance for the from address
        if (balanceChangesMap.has(from)) {
          let currentEntry = balanceChangesMap.get(from);
          currentEntry!["native"] = ZERO.sub(bnValue);
          balanceChangesMap.set(from, currentEntry!);
        } else {
          balanceChangesMap.set(from, { ["native"]: bnValue.mul(-1) });
        }

        // Update the native token balance for the to address
        if (balanceChangesMap.has(to)) {
          let currentEntry = balanceChangesMap.get(to);
          currentEntry!["native"] = ZERO.add(bnValue);
          balanceChangesMap.set(to, currentEntry!);
        } else {
          balanceChangesMap.set(to, { ["native"]: bnValue });
        }
      }
    }

    // Remove empty records and filter out WETH & WAVAX
    for (let key of Array.from(balanceChangesMap.keys())) {
      if (safeTokensPerChain[Number(txEvent.network)].includes(key)) {
        balanceChangesMap.delete(key);
        continue;
      }
      let record = balanceChangesMap.get(key)!;
      Object.keys(record).forEach((token) => {
        if (record[token].eq(ZERO)) {
          delete record[token];
        }
      });
      if (Object.keys(record).length === 0) {
        balanceChangesMap.delete(key);
      }
    }

    await Promise.all(
      Array.from(balanceChangesMap.entries()).map(async ([key, _]) => {
        if ([txEvent.from, ethers.constants.AddressZero].includes(key.toLowerCase())) {
          balanceChangesMap.delete(key);
          return;
        }
        let isContract = this.isContractCache.get(key);
        if (isContract === undefined) {
          const code = await this.provider.getCode(key);
          if (code === "0x") {
            balanceChangesMap.delete(key);
          } else {
            this.isContractCache.set(key, true);
          }
        }
      })
    );

    const balanceChangesMapUsd: Map<string, Record<string, number>> = new Map();
    // Get the USD value of the balance changes
    await Promise.all(
      Array.from(balanceChangesMap.entries()).map(async ([key, record]) => {
        const usdRecord: Record<string, number> = {};
        await Promise.all(
          Object.keys(record).map(async (token) => {
            const UsdValue = await this.getValueInUsd(
              txEvent.blockNumber,
              txEvent.network,
              record[token].toString(),
              token
            );
            usdRecord[token] = UsdValue;
          })
        );
        balanceChangesMapUsd.set(key, usdRecord);
      })
    );

    const victims: { address: string; confidence: number }[] = [];

    balanceChangesMapUsd.forEach((record: Record<string, number>, address: string) => {
      const sum = Object.values(record).reduce((acc, value) => {
        return acc + value;
      }, 0);
      // If the sum of the values is less than -100 USD, add the address to the victims list
      if (sum < -500) {
        const confidence = this.getExploitationStageConfidenceLevel(sum * -1, "usdValue") as number;
        victims.push({ address, confidence });
      }
    });

    // For tokens with no USD value fetched, check if the balance change is greater than 5% of the total supply
    await Promise.all(
      Array.from(balanceChangesMapUsd.entries()).map(async ([address, record]) => {
        return Promise.all(
          Object.keys(record).map(async (token) => {
            const usdValue = record[token];

            if (usdValue === 0 && token !== "native") {
              const value = balanceChangesMap.get(address);

              if (value![token].isNegative()) {
                const totalSupply = await this.getTotalSupply(txEvent.blockNumber, token);
                const threshold = totalSupply.div(20); // 5%
                const absValue = value![token].mul(-1);

                if (absValue.gt(threshold)) {
                  let percentage: number;
                  try {
                    percentage = absValue.mul(100).div(totalSupply).toNumber();
                  } catch {
                    percentage = 100;
                  }

                  const confidence = this.getExploitationStageConfidenceLevel(percentage, "totalSupply") as number;
                  victims.push({ address, confidence });
                }
              }
            }
          })
        );
      })
    );

    return [victims, balanceChangesMap];
  };

  // Get the number of occurences of the victims in previously deployed contracts code
  private getVictimOccurences = async (txEvent: TransactionEvent) => {
    const { network: chainId, blockNumber } = txEvent;
    let alertQueryOptions;

    if (!this.init) {
      this.init = true;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const blockDateRange = {
        startDate,
        endDate,
      };
      alertQueryOptions = {
        botIds: PREPARATION_BOT,
        chainId: chainId,
        alertId: "SUSPICIOUS-CONTRACT-CREATION",
        blockDateRange,
        first: 3000,
      };
    } else {
      const blockNumberRange = {
        startBlockNumber: blockNumber - 1,
        endBlockNumber: blockNumber - 1,
      };
      alertQueryOptions = {
        botIds: PREPARATION_BOT,
        chainId: chainId,
        alertId: "SUSPICIOUS-CONTRACT-CREATION",
        blockNumberRange,
        first: 3000,
      };
    }

    let startingCursor;
    // Set the number of retries
    let retries = 5;
    //Loop until the startingCursor.blockNumber is 0 or until the retries are exhausted
    while ((!startingCursor || startingCursor.blockNumber > 0) && retries > 0) {
      try {
        // Attempt to get the preparation stage alerts
        const preparationStageAlerts: AlertsResponse = await getAlerts({
          ...alertQueryOptions,
          startingCursor,
        });

        // Loop through the preparation stage alerts, and extract the addresses contained in the metadata
        preparationStageAlerts.alerts.forEach((alert: Alert) => {
          if (alert.metadata) {
            const values: string[] = Object.values(alert.metadata);
            const victimContracts: string[] = values.filter(
              (value: string) => value.startsWith("0x") && !value.includes(",") && value.length > 10
            );
            victimContracts.forEach((victim: string) => {
              this.victimOccurrences[victim] = this.victimOccurrences[victim] ? ++this.victimOccurrences[victim] : 1;
            });
          }
        });
        startingCursor = preparationStageAlerts.pageInfo.endCursor;
      } catch (error) {
        // Decrement the number of retries left
        retries--;

        // If retries is greater than 0, retry the operation
        if (retries > 0) {
          continue;
        }
      }
    }

    let maxOccurrences = 0;

    for (const victim in this.victimOccurrences) {
      if (this.victimOccurrences[victim] > maxOccurrences) {
        maxOccurrences = this.victimOccurrences[victim];
      }
    }

    this.maxOccurrences = maxOccurrences;

    return this.victimOccurrences;
  };

  private getPreparationStageConfidenceLevels = (victims: Record<string, number>): Record<string, number> => {
    // Create an object to store the confidence levels for each victim
    const confidenceLevels: Record<string, number> = {};

    // Loop through the victims
    for (const victim in victims) {
      /*
        Calculate Confidence Level based on the number of occurrences of the victim address in previously deployed contracts
        If the number of occurrences is equal to or greater than the maximum number of occurrences divided by 4 (this.maxOccurrences/4), the Confidence Level is 0.
        Otherwise, the Confidence Level is calculated by dividing the number of occurrences by the maximum number of occurrences (divided by 4)
        and then subtracting the result from 1.
        The resulting Confidence Level is then multiplied by 10 and divided by 10, which has the effect of rounding the value to the nearest tenth.
        The final Confidence Level will be a number between 0 and 1, with 0.1 increments (e.g. 0.1, 0.2, 0.3, etc.)
       */
      let confidenceLevel = Math.round((1 - victims[victim] / (this.maxOccurrences / 4)) * 10) / 10;

      // Ensure that the confidence level is never less than 0
      confidenceLevel = Math.max(confidenceLevel, 0);

      // Store the confidence level in the confidenceLevels object
      confidenceLevels[victim] = confidenceLevel;
    }

    // Return the confidenceLevels object
    return confidenceLevels;
  };

  private getExploitationStageConfidenceLevel = (value: number, method: string) => {
    // "value" is either the USD value or the percentage of total supply
    if (method === "usdValue") {
      /*
        Calculate Confidence Level based on USD value.
        If the value is MAX_USD_VALUE or more, the Confidence Level is 1.
        Otherwise, the Confidence Level is calculated by:
         - Dividing the value by the maximum value (MAX_USD_VALUE)
         - Dividing the result by 10, which splits the range into 10 parts
         - Rounding the result to the nearest tenth
         - Dividing the result by 10, which scales the value down by a factor of 10 (range 0-1)
        The resulting Confidence Level will be a number between 0 and 1, with 0.1 increments (e.g. 0.1, 0.2, 0.3, etc.)
      */
      const level = Math.round(value / (MAX_USD_VALUE / 10)) / 10;
      return Math.min(1, level);
    } else if (method === "totalSupply") {
      if (value >= 30) {
        return 1;
      } else if (value >= 20) {
        return 0.9;
      } else if (value >= 10) {
        return 0.8;
      } else if (value >= 5) {
        return 0.7;
      }
    }
  };

  private identifyVictims = async (
    provider: ethers.providers.JsonRpcProvider,
    victims: string[],
    chainId: number,
    blockNumber: number
  ) => {
    let identifiedVictims: Record<
      string,
      { protocolUrl: string; protocolTwitter: string; tag: string; holders: string[] }
    > = {};

    // Retrieve the tag for the possible victim contract address
    for (const victim of victims) {
      // Process the promises one by one instead of using Promise.all to maintain the order
      const result = await (async () => {
        let tag: string = "";

        // Attempt to fetch the tag from Forta database
        tag = await fetchFortaLabel(victim.toLowerCase(), chainId);
        // If an error occurs, check if the victim is a contract
        if (!tag) {
          const contractCreator = await getContractCreator(victim.toLowerCase(), chainId);

          // If the victim is a contract, try to fetch the tag from Forta database using the contract creator
          if (contractCreator) {
            tag = await fetchFortaLabel(contractCreator, chainId);
            // If the tag ends with "Deployer", extract the name before the colon
            if (tag.endsWith("Deployer")) {
              tag = tag.split(":")[0];
            }
          }

          if (!tag) {
            // If the tag is still not found, try to fetch it using the ERC20 'symbol' or 'name' methods
            tag = await this.getSymbolOrName(chainId, blockNumber, victim.toLowerCase());

            // If the tag is "Not Found", try to fetch the contract name
            if (tag === "Not Found") {
              tag = await getContractName(provider, victim, chainId, blockNumber);
            }
          }
        }

        // Skip the victim if it is a known false positive
        if (
          tag.startsWith("MEV") ||
          tag.startsWith("Null") ||
          tag.startsWith("Fund") || // 0xa294cca691e4c83b1fc0c8d63d9a3eef0a196de1
          tag.split(" ").includes("Exploiter")
        ) {
          return;
        }

        let protocolUrl = "";
        let protocolTwitter = "";
        let holders: string[] = [];

        if (tag !== "Not Found" && tag !== "") {
          [protocolUrl, protocolTwitter] = urlAndTwitterFetcher(this.protocols, tag);
          if (protocolUrl === "" && protocolTwitter === "") {
            [protocolUrl, protocolTwitter] = urlAndTwitterFetcher(
              this.protocols,
              await this.getName(blockNumber, victim.toLowerCase())
            );
          }
          if (Number(chainId) === 1) {
            holders = await this.getHolders(victim, tag);
          }
        } else if (tag === "Not Found") {
          tag = "";
        }

        return {
          protocolUrl,
          protocolTwitter,
          tag,
          holders,
        };
      })();

      if (result !== undefined) {
        identifiedVictims[victim] = result;
      }
    }
    return identifiedVictims;
  };

  public getIdentifiedVictims = async (txEvent: TransactionEvent) => {
    const { network: chainId, blockNumber } = txEvent;
    if (blockNumber !== this.latestBlockNumber) {
      this.victimOccurrences = await this.getVictimOccurences(txEvent);
      this.latestBlockNumber = blockNumber;
    }

    // Fetch addresses extracted from newly deployed contracts
    const extractedAddresses = await this.addressesExtractor.extractAddresses(txEvent);
    const sortedRecord: Record<string, number> = {};
    for (const victim of Array.from(extractedAddresses)) {
      sortedRecord[victim] = this.victimOccurrences.hasOwnProperty(victim) ? this.victimOccurrences[victim] : 0;
    }

    // Filter out WETH and sort the victims by the number of occurrences
    const sortedPreparationStageVictims: Record<string, number> = Object.fromEntries(
      Object.entries(sortedRecord)
        .filter(([address]) => !safeTokensPerChain[Number(chainId)].includes(ethers.utils.getAddress(address)))
        .sort((a, b) => a[1] - b[1])
    );

    // Fetch potential victims on the exploitation stage
    const [exploitationStageVictims, balanceChanges] = (await this.getExploitationStageVictims(txEvent)) as [
      { address: string; confidence: number }[],
      Map<string, Record<string, ethers.BigNumber>>
    ];

    // Calculate confidence levels for preparation stage victims
    const preparationStageConfidenceLevels = this.getPreparationStageConfidenceLevels(sortedPreparationStageVictims);

    // Create the final object with the confidence levels
    const preparationStageVictimsWithConfidence: Record<
      string,
      {
        protocolUrl: string;
        protocolTwitter: string;
        tag: string;
        holders: string[];
        confidence: number;
      }
    > = {};

    // Identify the preparation stage victims
    const preparationStageIdentifiedVictims = await this.identifyVictims(
      this.provider,
      Object.keys(sortedPreparationStageVictims),
      Number(chainId),
      blockNumber
    );

    // Add confidence property to the preparation stage victims objects
    for (const victim in preparationStageConfidenceLevels) {
      preparationStageVictimsWithConfidence[victim] = {
        ...preparationStageIdentifiedVictims[victim],
        confidence: preparationStageConfidenceLevels[victim],
      };
    }

    // Identify the exploitation stage victims
    const exploitationStageIdentifiedVictims = await this.identifyVictims(
      this.provider,
      exploitationStageVictims.map((victim) => victim.address),
      Number(chainId),
      blockNumber
    );

    // Filter the exploitation stage victims to keep only the ones that were identified
    const filteredExploitationStageVictims = exploitationStageVictims.filter((victim) =>
      Object.keys(exploitationStageIdentifiedVictims).includes(victim.address)
    );

    // Create the final object with the confidence levels
    const exploitationStageVictimsWithConfidence: Record<
      string,
      {
        protocolUrl: string;
        protocolTwitter: string;
        tag: string;
        holders: string[];
        confidence: number;
      }
    > = {};

    // Add confidence property to the exploitation stage victims objects
    for (const victim of filteredExploitationStageVictims) {
      exploitationStageVictimsWithConfidence[victim.address] = {
        ...exploitationStageIdentifiedVictims[victim.address],
        confidence: victim.confidence,
      };
    }

    // Replace pools of known protocols with the underlying tokens
    for (const victim in exploitationStageVictimsWithConfidence) {
      const tag = exploitationStageVictimsWithConfidence[victim].tag;
      let tokensToIdentify: string[] = [];

      if (SAFE_TAGS.some((safeTag) => tag.startsWith(safeTag))) {
        const balanceChange = balanceChanges.get(victim) as Record<string, ethers.BigNumber>;
        for (let token in balanceChange) {
          token = ethers.utils.getAddress(token);
          if (
            !safeTokensPerChain[Number(chainId)].includes(token) &&
            !(token in exploitationStageVictimsWithConfidence)
          ) {
            tokensToIdentify.push(token);
          }
        }
        // If the victim is a known protocol's pool and the sum of at least one of the tokens is 0, fetch the transfer events to find the token address
        if (Object.keys(balanceChange).length < 2) {
          const transferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT);
          transferEvents.forEach((event) => {
            const { from, to } = event.args;
            if (from === victim || to === victim) {
              const token = ethers.utils.getAddress(event.address);
              if (
                !safeTokensPerChain[Number(chainId)].includes(token) &&
                !(token in exploitationStageVictimsWithConfidence) &&
                !tokensToIdentify.includes(token)
              ) {
                tokensToIdentify.push(token);
              }
            }
          });
        }
        if (tokensToIdentify.length > 0) {
          const identifiedTokens = await this.identifyVictims(
            this.provider,
            tokensToIdentify,
            Number(chainId),
            blockNumber
          );

          for (const token in identifiedTokens) {
            exploitationStageVictimsWithConfidence[token] = {
              ...identifiedTokens[token],
              confidence: exploitationStageVictimsWithConfidence[victim].confidence,
            };
          }
        }
        delete exploitationStageVictimsWithConfidence[victim];
      }
    }

    const sortedExploitationStageVictims: typeof exploitationStageVictimsWithConfidence = Object.fromEntries(
      Object.entries(exploitationStageVictimsWithConfidence).sort(([, a], [, b]) => b.confidence - a.confidence)
    );

    return {
      exploitationStage: sortedExploitationStageVictims,
      preparationStage: preparationStageVictimsWithConfidence,
    };
  };
}
