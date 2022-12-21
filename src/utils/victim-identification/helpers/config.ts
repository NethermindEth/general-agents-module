import * as dotenv from "dotenv";
dotenv.config();

export const ETHPLORER_API_KEY = process.env.ETHPLORER_API_KEY as string;
export const LUABASE_API_KEY = process.env.LUABASE_API_KEY as string;
export const MORALIS_API_KEY = process.env.MORALIS_API_KEY as string;

interface etherscanApisInterface {
  [key: number]: {
    key: string;
    urlContractName: string;
    urlContractCreation: string;
  };
}

export const etherscanApis: etherscanApisInterface = {
  1: {
    key: process.env.ETHERSCAN_API_KEY as string,
    urlContractName: "https://api.etherscan.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.etherscan.io/api?module=contract&action=getcontractcreation",
  },
  10: {
    key: process.env.OPTIMISTIC_API_KEY as string,
    urlContractName: "https://api-optimistic.etherscan.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api-optimistic.etherscan.io/api?module=contract&action=getcontractcreation",
  },
  56: {
    key: process.env.BSCSCAN_API_KEY as string,
    urlContractName: "https://api.bscscan.com/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.bscscan.com/api?module=contract&action=getcontractcreation",
  },
  137: {
    key: process.env.POLYGONSCAN_API_KEY as string,
    urlContractName: "https://api.polygonscan.com/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.polygonscan.com/api?module=contract&action=getcontractcreation",
  },
  250: {
    key: process.env.FTMSCAN_API_KEY as string,
    urlContractName: "https://api.ftmscan.com/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.ftmscan.com/api?module=contract&action=getcontractcreation",
  },
  42161: {
    key: process.env.ARBISCAN_API_KEY as string,
    urlContractName: "https://api.arbiscan.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.arbiscan.io/api?module=contract&action=getcontractcreation",
  },
  43114: {
    key: process.env.SNOWTRACE_API_KEY as string,
    urlContractName: "https://api.snowtrace.io/api?module=contract&action=getsourcecode",
    urlContractCreation: "https://api.snowtrace.io/api?module=contract&action=getcontractcreation",
  },
};
