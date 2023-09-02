import { ethers } from "forta-agent";
import { createAddress, createTransactionHash } from "../utils";

export class MockTransactionData implements ethers.providers.TransactionResponse, ethers.providers.TransactionReceipt {
  hash: string;
  blockNumber: number;
  blockHash: string;
  timestamp?: number;
  confirmations: number;
  from: string;
  raw?: string;
  wait: (confirmations?: number) => Promise<ethers.providers.TransactionReceipt>;
  to: string;
  nonce: number;
  gasLimit: ethers.BigNumber;
  gasPrice?: ethers.BigNumber;
  data: string;
  value: ethers.BigNumber;
  chainId: number;
  r?: string;
  s?: string;
  v?: number;
  type: number;
  accessList?: ethers.utils.AccessList;
  maxPriorityFeePerGas?: ethers.BigNumber;
  maxFeePerGas?: ethers.BigNumber;

  contractAddress: string;
  transactionIndex: number;
  root?: string | undefined;
  gasUsed: ethers.BigNumber;
  logsBloom: string;
  transactionHash: string;
  logs: ethers.providers.Log[];
  cumulativeGasUsed: ethers.BigNumber;
  effectiveGasPrice: ethers.BigNumber;
  byzantium: boolean;
  status?: number | undefined;

  constructor() {
    this.hash = "0x";
    this.confirmations = 0;
    this.from = createAddress("0x1234");
    this.nonce = 1;
    this.gasLimit = ethers.BigNumber.from(21000);
    this.data = "0x";
    this.value = ethers.BigNumber.from(10000);
    this.chainId = 1;
    this.to = createAddress("0x256");
    this.type = 1;
    this.blockHash = "0x";
    this.blockNumber = 1;
    this.timestamp = Date.now();

    this.contractAddress = createAddress("0x789");
    this.transactionIndex = 0;
    this.gasUsed = ethers.BigNumber.from(1000);
    this.logsBloom = "0x";
    this.transactionHash = "0x";
    this.logs = [];
    this.cumulativeGasUsed = ethers.BigNumber.from(1000);
    this.effectiveGasPrice = ethers.BigNumber.from(1000);
    this.byzantium = false;

    this.wait = this._wait;
  }

  private _wait = (confirmations?: number): Promise<ethers.providers.TransactionReceipt> => {
    return Promise.resolve(this);
  };

  public setHash(hash: string): MockTransactionData {
    this.hash = hash;
    this.transactionHash = hash;
    return this;
  }

  public generateHash(): MockTransactionData {
    const txParams: ethers.UnsignedTransaction = {
      to: this.to,
      nonce: this.nonce,
      gasLimit: this.gasLimit,
      gasPrice: this.gasPrice,
      data: this.data,
      value: ethers.utils.hexlify(this.value),
      chainId: this.chainId,
      type: this.type,
    };

    if (this.maxFeePerGas) txParams.maxFeePerGas = this.maxFeePerGas;
    if (this.maxPriorityFeePerGas) txParams.maxPriorityFeePerGas = this.maxPriorityFeePerGas;

    this.hash = createTransactionHash(txParams);

    this.transactionHash = this.hash;
    return this;
  }

  public setFrom(address: string): MockTransactionData {
    this.from = address.toLowerCase();
    return this;
  }

  public setTo(address: string): MockTransactionData {
    this.to = address.toLowerCase();
    return this;
  }

  public setNonce(value: number): MockTransactionData {
    this.nonce = value;
    return this;
  }

  public setValue(value: string): MockTransactionData {
    this.value = ethers.BigNumber.from(value);
    return this;
  }

  public setGasLimit(value: string): MockTransactionData {
    this.gasLimit = ethers.BigNumber.from(value);
    return this;
  }

  public setGasPrice(value: string): MockTransactionData {
    this.gasPrice = ethers.BigNumber.from(value);
    return this;
  }

  public setData(data: string): MockTransactionData {
    this.data = data;
    return this;
  }

  public setGasUsed(value: string): MockTransactionData {
    this.gasUsed = ethers.BigNumber.from(value);
    return this;
  }

  public setLogsBloom(value: string): MockTransactionData {
    this.logsBloom = value;
    return this;
  }

  public setLogs(logs: ethers.providers.Log[]): MockTransactionData {
    this.logs = logs;
    return this;
  }

  public setBlockNumber(blockNumber: number): MockTransactionData {
    this.blockNumber = blockNumber;
    return this;
  }

  public setTimestamp(timestamp: number): MockTransactionData {
    this.timestamp = timestamp;
    return this;
  }

  public setContractAddress(address: string): MockTransactionData {
    this.contractAddress = address;
    return this;
  }

  public setTransactionIndex(index: number): MockTransactionData {
    this.transactionIndex = index;
    return this;
  }

  public setTransactionHash(hash: string): MockTransactionData {
    this.transactionHash = hash;
    return this;
  }

  public setCumulativeGasUsed(value: string): MockTransactionData {
    this.cumulativeGasUsed = ethers.BigNumber.from(value);
    return this;
  }

  public setEffectiveGasPrice(value: string): MockTransactionData {
    this.effectiveGasPrice = ethers.BigNumber.from(value);
    return this;
  }

  public setByzantium(value: boolean): MockTransactionData {
    this.byzantium = value;
    return this;
  }

  public setStatus(value: number): MockTransactionData {
    this.status = value;
    return this;
  }

  public setBlockHash(hash: string): MockTransactionData {
    this.blockHash = hash;
    return this;
  }

  public setRoot(root: string): MockTransactionData {
    this.root = root;
    return this;
  }

  public setChainId(chainId: number): MockTransactionData {
    this.chainId = chainId;
    return this;
  }

  public setR(r: string): MockTransactionData {
    this.r = r;
    return this;
  }

  public setS(s: string): MockTransactionData {
    this.s = s;
    return this;
  }

  public setV(v: number): MockTransactionData {
    this.v = v;
    return this;
  }

  public setAccessList(accessList: ethers.utils.AccessList): MockTransactionData {
    this.accessList = accessList;
    return this;
  }

  public setMaxPriorityFeePerGas(value: string): MockTransactionData {
    this.maxPriorityFeePerGas = ethers.BigNumber.from(value);
    return this;
  }

  public setMaxFeePerGas(value: string): MockTransactionData {
    this.maxFeePerGas = ethers.BigNumber.from(value);
    return this;
  }

  public setConfirmations(confirmations: number): MockTransactionData {
    this.confirmations = confirmations;
    return this;
  }

  public setRaw(raw: string): MockTransactionData {
    this.raw = raw;
    return this;
  }

  public setTransactionType(type: number): MockTransactionData {
    this.type = type;
    return this;
  }

  public setTransactionResponse(transaction: Partial<ethers.providers.TransactionResponse>): MockTransactionData {
    this.blockNumber = transaction.blockNumber ? transaction.blockNumber : this.blockNumber;
    this.blockHash = transaction.blockHash ? transaction.blockHash : this.blockHash;
    this.timestamp = transaction.timestamp;
    this.confirmations = transaction.confirmations ? transaction.confirmations : this.confirmations;
    this.from = transaction.from ? transaction.from : this.from;
    this.raw = transaction.raw ? transaction.raw : this.raw;
    this.to = transaction.to ? transaction.to : this.to;
    this.nonce = transaction.nonce ? transaction.nonce : this.nonce;
    this.gasLimit = transaction.gasLimit ? transaction.gasLimit : this.gasLimit;
    this.gasPrice = transaction.gasPrice;
    this.data = transaction.data ? transaction.data : this.data;
    this.value = transaction.value ? transaction.value : this.value;
    this.chainId = transaction.chainId ? transaction.chainId : this.chainId;
    this.r = transaction.r ? transaction.r : this.r;
    this.s = transaction.s ? transaction.s : this.s;
    this.v = transaction.v ? transaction.v : this.v;
    this.type = transaction.type ? transaction.type : this.type;
    this.accessList = transaction.accessList ? transaction.accessList : this.accessList;
    this.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas
      ? transaction.maxPriorityFeePerGas
      : this.maxPriorityFeePerGas;
    this.maxFeePerGas = transaction.maxFeePerGas ? transaction.maxFeePerGas : this.maxFeePerGas;

    if (transaction.hash) this.setHash(transaction.hash);
    else this.generateHash();

    return this;
  }

  public setTransactionReceipt(receipt: Partial<ethers.providers.TransactionReceipt>): MockTransactionData {
    this.to = receipt.to ? receipt.to : this.to;
    this.from = receipt.from ? receipt.from : this.from;
    this.contractAddress = receipt.contractAddress ? receipt.contractAddress : this.contractAddress;
    this.transactionIndex = receipt.transactionIndex ? receipt.transactionIndex : this.transactionIndex;
    this.root = receipt.root ? receipt.root : this.root;
    this.gasUsed = receipt.gasUsed ? receipt.gasUsed : this.gasUsed;
    this.logsBloom = receipt.logsBloom ? receipt.logsBloom : this.logsBloom;
    this.blockHash = receipt.blockHash ? receipt.blockHash : this.blockHash;
    this.hash = receipt.transactionHash ? receipt.transactionHash : this.hash;
    this.logs = receipt.logs ? receipt.logs : this.logs;
    this.cumulativeGasUsed = receipt.cumulativeGasUsed ? receipt.cumulativeGasUsed : this.cumulativeGasUsed;
    this.effectiveGasPrice = receipt.effectiveGasPrice ? receipt.effectiveGasPrice : this.effectiveGasPrice;
    this.byzantium = receipt.byzantium ? receipt.byzantium : this.byzantium;
    this.type = receipt.type ? receipt.type : this.type;
    this.status = receipt.status;

    if (receipt.transactionHash) this.setHash(receipt.transactionHash);
    else this.generateHash();

    return this;
  }

  public getTransactionResponse(): ethers.providers.TransactionResponse {
    const transaction: ethers.providers.TransactionResponse = {
      hash: this.hash,
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      timestamp: this.timestamp,
      confirmations: this.confirmations,
      from: this.from,
      raw: this.raw,
      wait: this.wait,
      to: this.to,
      nonce: this.nonce,
      gasLimit: this.gasLimit,
      gasPrice: this.gasPrice,
      data: this.data,
      value: this.value,
      chainId: this.chainId,
      r: this.r,
      s: this.s,
      v: this.v,
      type: this.type,
      accessList: this.accessList,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas,
      maxFeePerGas: this.maxFeePerGas,
    };

    return transaction;
  }

  public getTransactionReceipt(): ethers.providers.TransactionReceipt {
    const receipt: ethers.providers.TransactionReceipt = {
      to: this.to,
      from: this.from,
      contractAddress: this.contractAddress,
      transactionIndex: this.transactionIndex,
      root: this.root,
      gasUsed: this.gasUsed,
      logsBloom: this.logsBloom,
      blockHash: this.blockHash,
      transactionHash: this.transactionHash,
      logs: this.logs,
      cumulativeGasUsed: this.cumulativeGasUsed,
      effectiveGasPrice: this.effectiveGasPrice,
      byzantium: this.byzantium,
      type: this.type,
      status: this.status,
      blockNumber: this.blockNumber,
      confirmations: this.confirmations,
    };

    return receipt;
  }
}

export default MockTransactionData;
