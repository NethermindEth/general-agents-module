import { BigNumber, ethers } from "ethers";
import { MockTransactionData } from "./mock_transaction_data";
import { createAddress } from "../utils";

describe("Mock Transaction Data Test Suite", () => {
  let mockTransactionData: MockTransactionData;

  beforeEach(() => {
    mockTransactionData = new MockTransactionData();
  });

  it("sets the given Hash", () => {
    const hash = ethers.utils.keccak256("0x1234");
    mockTransactionData.setHash(hash);
    expect(mockTransactionData.hash).toEqual(hash);
    expect(mockTransactionData.transactionHash).toEqual(hash);
  });

  it("generates the same hash for the same txParams", () => {
    const txParams = {
      nonce: 1,
      gasLimit: BigNumber.from(21000),
      gasPrice: BigNumber.from(1000000000),
      to: createAddress("0x67"),
      value: BigNumber.from(1000000000),
      data: "0x",
      chainId: 0,
      from: createAddress("0x87"),
    };

    const hash1 = mockTransactionData.setTransactionResponse(txParams).hash;
    const hash2 = mockTransactionData.setTransactionReceipt(txParams).hash;
    const hash3 = mockTransactionData.generateHash().hash;

    expect(hash1).toEqual(hash2);
    expect(hash2).toEqual(hash3);
  });

  it("sets the given from address", () => {
    const from = createAddress("0x1234");
    mockTransactionData.setFrom(from);
    expect(mockTransactionData.from).toEqual(from);
  });

  it("sets the given to address", () => {
    const to = createAddress("0x1234");
    mockTransactionData.setTo(to);
    expect(mockTransactionData.to).toEqual(to);
  });

  it("returns an Object compatible with ethers TransactionResponse", () => {
    const txParams = {
      nonce: 1,
      gasLimit: BigNumber.from(21000),
      gasPrice: BigNumber.from(1000000000),
      to: createAddress("0x67"),
      value: BigNumber.from(1000000000),
      data: "0x",
      chainId: 1,
      from: createAddress("0x87"),
      timestamp: Date.now(),
    };

    const response: ethers.providers.TransactionResponse = mockTransactionData
      .setTransactionResponse(txParams)
      .getTransactionResponse();

    expect(response).toEqual({
      hash: mockTransactionData.hash,
      blockHash: mockTransactionData.blockHash,
      blockNumber: mockTransactionData.blockNumber,
      timestamp: txParams.timestamp,
      confirmations: 0,
      from: txParams.from,
      to: txParams.to,
      data: txParams.data,
      gasLimit: txParams.gasLimit,
      gasPrice: txParams.gasPrice,
      value: txParams.value,
      nonce: txParams.nonce,
      chainId: txParams.chainId,
      type: 1,
      wait: expect.any(Function),
      accessList: undefined,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      r: undefined,
      s: undefined,
      v: undefined,
      raw: undefined,
    });
  });

  it("returns an Object compatible with ethers TransactionReceipt", () => {
    const txParams = {
      nonce: 1,
      gasLimit: BigNumber.from(21000),
      gasPrice: BigNumber.from(1000000000),
      to: createAddress("0x67"),
      value: BigNumber.from(1000000000),
      data: "0x",
      chainId: 1,
      from: createAddress("0x87"),
      timestamp: Date.now(),
    };

    const receipt: ethers.providers.TransactionReceipt = mockTransactionData
      .setTransactionReceipt(txParams)
      .getTransactionReceipt();

    expect(receipt).toEqual({
      blockHash: mockTransactionData.blockHash,
      blockNumber: mockTransactionData.blockNumber,
      byzantium: false,
      confirmations: 0,
      contractAddress: mockTransactionData.contractAddress,
      cumulativeGasUsed: mockTransactionData.cumulativeGasUsed,
      effectiveGasPrice: mockTransactionData.effectiveGasPrice,
      from: txParams.from,
      gasUsed: mockTransactionData.gasUsed,
      logs: mockTransactionData.logs,
      logsBloom: mockTransactionData.logsBloom,
      root: mockTransactionData.root,
      status: mockTransactionData.status,
      to: txParams.to,
      transactionHash: mockTransactionData.transactionHash,
      transactionIndex: mockTransactionData.transactionIndex,
      type: 1,
    });
  });
});
