export interface apiKeys {
  ethplorerApiKey?: string;
  luabaseApiKey?: string;
  moralisApiKey?: string;
  etherscanApiKey?: string;
  optimisticEtherscanApiKey?: string;
  bscscanApiKey?: string;
  polygonscanApiKey?: string;
  fantomscanApiKey?: string;
  arbitrumApiKey?: string;
  snowtraceApiKey?: string;
}

export const restApis: Record<string, string> = {
  ethplorerKey: "",
  luabaseKey: "",
  moralisKey: "",
};

interface etherscanApisInterface {
  [key: number]: {
    key: string;
    urlContractName: string;
    urlContractCreation: string;
  };
}

export const etherscanApis: etherscanApisInterface = {
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
