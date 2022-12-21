import { etherscanApis, LUABASE_API_KEY, MORALIS_API_KEY } from "./config";
import { getWebsiteAndTwitter } from "./urlAndTwitter";

export const urlAndTwitterFetcher = (protocols: string[][], tag: string): string[] => {
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

export const fetchLuabaseDb = async (address: string, chain: string): Promise<string> => {
  const sqlQuery: string = `
        select tag
        from ${chain}.tags 
        where address='${address}'
        limit 15
      `;

  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      block: {
        details: {
          sql: sqlQuery,
          parameters: {},
        },
      },
      api_key: LUABASE_API_KEY,
    }),
  };
  let response;
  try {
    response = await (await fetch("https://q.luabase.com/run", options)).json();
    return response.data[0].tag;
  } catch {
    return "";
  }
};

export const getNativeTokenSymbolByChainId = (chainId: number) => {
  switch (Number(chainId)) {
    case 10:
      return "ETH";
    case 56:
      return "BNB";
    case 137:
      return "MATIC";
    case 250:
      return "FTM";
    case 42161:
      return "ETH";
    case 43114:
      return "AVAX";
    default:
      return "ETH";
  }
};

export const getChainByChainId = (chainId: number) => {
  switch (Number(chainId)) {
    case 10:
      return "optimistic-ethereum";
    case 56:
      return "binance-smart-chain";
    case 137:
      return "polygon-pos";
    case 250:
      return "fantom";
    case 42161:
      return "arbitrum-one";
    case 43114:
      return "avalanche";
    default:
      return "ethereum";
  }
};

export const getMoralisChainByChainId = (chainId: number) => {
  switch (Number(chainId)) {
    case 56:
      return "bsc";
    case 137:
      return "polygon";
    case 250:
      return "fantom";
    case 43114:
      return "avalanche";
    default:
      return "eth";
  }
};

export const getLuabaseChainByChainId = (chainId: number) => {
  switch (Number(chainId)) {
    case 250:
      return "fantom";
    case 137:
      return "polygon";
    default:
      return "ethereum";
  }
};

export const getNativeTokenByChainId = (chainId: number) => {
  switch (Number(chainId)) {
    case 10:
      return "ethereum";
    case 56:
      return "binancecoin";
    case 137:
      return "matic-network";
    case 250:
      return "fantom";
    case 42161:
      return "ethereum";
    case 43114:
      return "avalanche-2";
    default:
      return "ethereum";
  }
};

export const getTokenPriceUrl = (chain: string, token: string) => {
  return `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${token}&vs_currencies=usd`;
};

export const getNativeTokenPrice = (chain: string) => {
  return `https://api.coingecko.com/api/v3/simple/price?ids=${chain}&vs_currencies=usd`;
};

// Fetches prices from both UniswapV2 and UniswapV3
export const getUniswapPrice = async (chainId: number, token: string) => {
  const options = {
    method: "GET",
    params: { chain: getMoralisChainByChainId(chainId) },
    headers: { accept: "application/json", "X-API-Key": MORALIS_API_KEY },
  };
  const response = await (await fetch(`https://deep-index.moralis.io/api/v2/erc20/${token}/price`, options)).json();
  return response.usdPrice;
};

export const getContractCreator = async (address: string, chainId: number) => {
  const { urlContractCreation, key }: { urlContractCreation: string; key: string } = etherscanApis[chainId];
  const url = `${urlContractCreation}&contractaddresses=${address}&apikey=${key}`;

  let result;
  try {
    result = await (await fetch(url)).json();
    if (result.message.startsWith("NOTOK")) {
      console.log(`block explorer error occured; skipping check for ${address}`);
      return "";
    }
    return result.result[0].contractCreator;
  } catch {
    return "";
  }
};

export const getContractName = async (address: string, chainId: number) => {
  const { urlContractName, key }: { urlContractName: string; key: string } = etherscanApis[chainId];
  const url = `${urlContractName}&address=${address}&apikey=${key}`;
  let result;
  try {
    result = await (await fetch(url)).json();
    if (result.message.startsWith("NOTOK")) {
      console.log(`block explorer error occured; skipping check for ${address}`);
      return "Not Found";
    }
    const contractName = result.result[0].ContractName;
    if (contractName === "" || contractName.toLowerCase().includes("proxy")) {
      return "Not Found";
    }
    return contractName;
  } catch {
    return "Not Found";
  }
};

export const getTopTokenHoldersUrl = (tokenAddress: string, key: string) => {
  return `https://api.ethplorer.io/getTopTokenHolders/${tokenAddress}?apiKey=${key}&limit=1000`;
};

export const uniswapV3Query = (pool: string) => {
  return `
  {
    positions(where: {
      pool: "${pool.toLowerCase()}"
    }) {
      owner
    }
  }
  `;
};
