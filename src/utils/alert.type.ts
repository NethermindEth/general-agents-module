import { Label } from "forta-agent";

export declare type AlertContract = {
  address: string;
  name: string;
  projectId?: string;
};
export declare type AlertSource = {
  transactionHash?: string;
  block?: {
    timestamp: string;
    chainId: number;
    hash: string;
    number: number;
  };
  bot?: {
    id?: string;
    reference?: string;
    image?: string;
  };
  sourceAlert?: {
    hash?: string;
    botId?: string;
    timestamp?: string;
    chainId?: number;
  };
};
export declare type AlertProject = {
  id: string;
  name: string;
  contacts?: {
    securityEmailAddress?: string;
    generalEmailAddress?: string;
  };
  website?: string;
  token?: {
    symbol?: string;
    name?: string;
    decimals?: number;
    chainId: number;
    address: string;
  };
  social?: {
    twitter?: string;
    github?: string;
    everest?: string;
    coingecko?: string;
  };
};
export declare type AlertAddressBloomFilter = {
  bitset: string;
  k: string;
  m: string;
};

export declare type AlertInput = {
  addresses?: string[];
  alertId?: string;
  hash?: string;
  contracts?: AlertContract[];
  createdAt?: string;
  description?: string;
  findingType?: string;
  name?: string;
  protocol?: string;
  scanNodeCount?: number;
  severity?: string;
  alertDocumentType?: string;
  relatedAlerts?: string[];
  chainId?: number;
  labels?: Label[];
  source?: AlertSource;
  metadata?: any;
  projects?: AlertProject[];
  addressBloomFilter?: AlertAddressBloomFilter;
};
