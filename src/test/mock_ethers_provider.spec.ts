import { utils, Contract } from "ethers";
import { ethers, keccak256 } from "forta-agent";
import { createAddress } from "../utils";
import MockEthersProvider from "./mock_ethers_provider";
import MockTransactionData from "./mock_transaction_data";

const EVENT_1_SIGHASH: string = keccak256("Event1()");
const EVENT_2_SIGHASH: string = keccak256("Event2()");

describe("MockEthersProvider tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  beforeEach(() => mockProvider.clear());

  it.each(["call", "getBlock", "getSigner", "getStorageAt", "getBlockNumber", "getNetwork"] as Array<
    keyof MockEthersProvider
  >)("%s should throw an error if not configured for a specific input", async (method) => {
    await expect(mockProvider[method]).rejects.toEqual(new Error(`${method} was not configured for this input`));
  });

  it("should return the correct storage", async () => {
    const CASES: [string, number, number, string][] = [
      ["0xdef10", 1, 0, "0xe0a0"],
      ["0xdef11", 21, 70, "0xe0a1"],
      ["0xdef12", 100, 99, "0xe0a2"],
      ["0xdef13", 4, 201, "0xe0a3"],
      ["0xdef14", 42, 1234, "0xe0a4"],
    ];

    for (let [shortContract, slot, block, shortAddr] of CASES) {
      const encodedSlot: string = utils.hexZeroPad(shortAddr, 32);
      const contract: string = createAddress(shortContract);

      mockProvider.addStorage(contract, slot, block, encodedSlot);

      // check the storage twice
      expect(await mockProvider.getStorageAt(contract, slot, block)).toStrictEqual(encodedSlot);
      expect(await mockProvider.getStorageAt(contract, slot, block)).toStrictEqual(encodedSlot);
    }
  });

  it("should return the correct block", async () => {
    const CASES: Record<string, any>[] = [
      { difficulty: 200, number: 25, timestamp: 31 },
      { difficulty: 50, number: 212, timestamp: 3131 },
      { difficulty: 4020, number: 2, timestamp: 888 },
      { difficulty: 7, number: 1789, timestamp: 1 },
    ];

    for (let block of CASES) {
      mockProvider.addBlock(block.number, block);

      // check the block twice
      expect(await mockProvider.getBlock(block.number)).toStrictEqual(block);
      expect(await mockProvider.getBlock(block.number)).toStrictEqual(block);
    }
  });

  it("should return the correct output in the calls", async () => {
    const iface: utils.Interface = new utils.Interface([
      "function foo(uint256 val, string a, string b) external view returns (uint256 id1, uint256 id2)",
      "function details(uint256 user_id) external view returns (string user_data)",
      "function something(bytes _bytes) external view returns (string _string, bytes _id)",
    ]);

    const listMatch = (listA: any[], listB: any[]) => {
      for (let i = 0; i < listB.length; ++i) expect(listA[i].toString()).toStrictEqual(listB[i].toString());
    };

    const valueMatch = (value: any[], dataList: any[]) => {
      expect(value.toString()).toStrictEqual(dataList[0].toString());
    };

    const CASES: [string, string, any[], any[], number][] = [
      ["0xc0de0", "foo", [1, "a", "b"], [20, 30], 1],
      ["0xc0de1", "foo", [1, "a", "c"], [200, 1234], 2],
      ["0xc0de2", "something", ["0x1234"], ["a", "0xabcd"], 3],
      ["0xc0de3", "details", [626], ["stish"], 3],
      ["0xc0de4", "something", ["0x1234a111"], ["a", "0xabcd"], 9],
      ["0xc0de5", "something", ["0xffffffff"], ["b", "0x20220214"], 333],
    ];

    for (let [shortContract, id, inputs, outputs, block] of CASES) {
      const contract: string = createAddress(shortContract);
      mockProvider.addCallTo(contract, block, iface, id, { inputs, outputs });

      const ethersContract: Contract = new Contract(contract, iface, mockProvider as any);

      // check the call twice
      let returnedValue: any = await ethersContract[id](...inputs, { blockTag: block });
      if (outputs.length > 1) listMatch(returnedValue, outputs);
      else valueMatch(returnedValue, outputs);

      returnedValue = await ethersContract[id](...inputs, { blockTag: block });
      if (outputs.length > 1) listMatch(returnedValue, outputs);
      else valueMatch(returnedValue, outputs);
    }
  });

  it("should set the latest block", async () => {
    const CASES: number[] = [1, 10, 20, 9, 0, 201209];

    for (let block of CASES) {
      mockProvider.setLatestBlock(block);

      // check the block twice
      expect(await mockProvider.getBlockNumber()).toStrictEqual(block);
      expect(await mockProvider.getBlockNumber()).toStrictEqual(block);
    }
  });

  it.each([
    {
      filter: {
        topics: [EVENT_1_SIGHASH],
      },
      logs: [{ topics: [EVENT_1_SIGHASH] }, { topics: [EVENT_2_SIGHASH] }],
      expected: [{ topics: [EVENT_1_SIGHASH] }],
    },
    {
      filter: {
        topics: [[EVENT_1_SIGHASH]],
      },
      logs: [{ topics: [EVENT_1_SIGHASH] }, { topics: [EVENT_2_SIGHASH] }],
      expected: [{ topics: [EVENT_1_SIGHASH] }],
    },
    {
      filter: {
        topics: [[EVENT_1_SIGHASH, EVENT_2_SIGHASH]],
      },
      logs: [{ topics: [EVENT_1_SIGHASH] }, { topics: [EVENT_2_SIGHASH] }],
      expected: [{ topics: [EVENT_1_SIGHASH] }, { topics: [EVENT_2_SIGHASH] }],
    },
    {
      filter: {
        topics: [null],
      },
      logs: [
        { topics: [EVENT_1_SIGHASH, EVENT_2_SIGHASH] },
        { topics: [EVENT_1_SIGHASH] },
        { topics: [EVENT_2_SIGHASH] },
      ],
      expected: [
        { topics: [EVENT_1_SIGHASH, EVENT_2_SIGHASH] },
        { topics: [EVENT_1_SIGHASH] },
        { topics: [EVENT_2_SIGHASH] },
      ],
    },
    {
      filter: {
        address: createAddress("0x1"),
      },
      logs: [{ address: createAddress("0x1") }, { address: createAddress("0x2") }],
      expected: [{ address: createAddress("0x1") }],
    },
    {
      filter: {
        fromBlock: 2,
      },
      logs: [{ blockNumber: 1 }, { blockNumber: 2 }, { blockNumber: 3 }],
      expected: [{ blockNumber: 2 }, { blockNumber: 3 }],
    },
    {
      filter: {
        toBlock: 2,
      },
      logs: [{ blockNumber: 1 }, { blockNumber: 2 }, { blockNumber: 3 }],
      expected: [{ blockNumber: 1 }, { blockNumber: 2 }],
    },
    {
      filter: {
        fromBlock: 1,
        toBlock: 1,
      },
      logs: [{ blockNumber: 1 }, { blockNumber: 2 }, { blockNumber: 3 }],
      expected: [{ blockNumber: 1 }],
    },
    {
      filter: {
        blockHash: "0x1",
      },
      logs: [{ blockHash: "0x1" }, { blockHash: "0x1" }, { blockHash: "0x2" }],
      expected: [{ blockHash: "0x1" }, { blockHash: "0x1" }],
    },
  ])("should return the corresponding logs (case $#)", async ({ filter, logs, expected }) => {
    mockProvider.addLogs(logs as any);

    // check the logs twice
    expect(await mockProvider.getLogs(filter)).toStrictEqual(expected);
    expect(await mockProvider.getLogs(filter)).toStrictEqual(expected);

    // check that the expected parameter is based on the filter object content, not reference
    expect(await mockProvider.getLogs({ ...filter })).toStrictEqual(expected);
  });

  it("should return the mocked network information", async () => {
    const networkInfo: ethers.providers.Network = {
      chainId: 1,
      ensAddress: createAddress("0x1"),
      name: "network",
    };

    mockProvider.setNetwork(networkInfo.chainId, networkInfo.ensAddress, networkInfo.name);

    expect(await mockProvider.getNetwork()).toStrictEqual(networkInfo);
  });

  it("should return the same signer if requested multiples times", async () => {
    const signers: string[] = [createAddress("0x20"), createAddress("0xdead"), createAddress("0x5474")];
    for (let addr of signers) {
      mockProvider.addSigner(addr);
      // set a value in one of the internal mocks of the signer
      mockProvider.getSigner(addr).sendTransaction.mockReturnValue(`old-call-from-${addr}`);
    }
    for (let addr of signers) {
      // check the value previously set
      expect(mockProvider.getSigner(addr).sendTransaction()).toStrictEqual(`old-call-from-${addr}`);
    }
  });

  it("should return the mocked transaction response", async () => {
    const mockTransactionData: MockTransactionData = new MockTransactionData();

    const txParams: Partial<ethers.providers.TransactionResponse> = {
      nonce: 1,
      gasLimit: ethers.BigNumber.from(21000),
      gasPrice: ethers.BigNumber.from(1000000000),
      to: createAddress("0x67"),
      value: ethers.utils.parseEther("1"),
      data: "0x",
      chainId: 1,
      from: createAddress("0x87"),
      timestamp: Date.now(),
      blockHash: ethers.utils.keccak256("0x1234"),
      blockNumber: 1337,
      confirmations: 1,
      maxFeePerGas: ethers.BigNumber.from(1000000000),
      maxPriorityFeePerGas: ethers.BigNumber.from(1000000000),
      r: "0x",
      s: "0x",
      v: 0,
      raw: "0x",
      type: 1,
    };

    mockTransactionData.setTransactionResponse(txParams);

    mockProvider.setTransaction(mockTransactionData);

    const transactionResponse: ethers.providers.TransactionResponse = await mockProvider.getTransaction(
      mockTransactionData.hash
    );
    expect(transactionResponse).toStrictEqual(mockTransactionData.getTransactionResponse());

    mockTransactionData.setHash(ethers.utils.hexlify(ethers.utils.randomBytes(32)));

    mockProvider.setTransaction(mockTransactionData);

    const txResponse: ethers.providers.TransactionResponse = await mockProvider.getTransaction(
      mockTransactionData.hash
    );
    expect(txResponse).toStrictEqual(mockTransactionData.getTransactionResponse());
  });

  it("should return the mocked transaction receipt", async () => {
    const mockTransactionData: MockTransactionData = new MockTransactionData();

    const txReceiptParams: Partial<ethers.providers.TransactionReceipt> = {
      to: createAddress("0x67"),
      from: createAddress("0x87"),
      contractAddress: createAddress("0x87"),
      transactionIndex: 0,
      gasUsed: ethers.BigNumber.from(21000),
      logsBloom: "0x",
      blockHash: ethers.utils.keccak256("0x1234"),
      blockNumber: 1337,
      confirmations: 1,
      cumulativeGasUsed: ethers.BigNumber.from(21000),
      byzantium: true,
      logs: [],
      status: 1,
      type: 1,
      effectiveGasPrice: ethers.BigNumber.from(1000000000),
      root: "0x",
    };

    mockTransactionData.setTransactionReceipt(txReceiptParams);

    mockProvider.setTransaction(mockTransactionData);

    const transactionReceipt: ethers.providers.TransactionReceipt = await mockProvider.getTransactionReceipt(
      mockTransactionData.hash
    );
    expect(transactionReceipt).toStrictEqual(mockTransactionData.getTransactionReceipt());

    mockTransactionData.setHash(ethers.utils.hexlify(ethers.utils.randomBytes(32)));

    mockProvider.setTransaction(mockTransactionData);

    const txReceipt: ethers.providers.TransactionReceipt = await mockProvider.getTransactionReceipt(
      mockTransactionData.hash
    );
    expect(txReceipt).toStrictEqual(mockTransactionData.getTransactionReceipt());
  });

  it("should return the mocked transaction data when set transaction is used", async () => {
    const mockTransactionData: MockTransactionData = new MockTransactionData();

    const txParams: Partial<ethers.providers.TransactionResponse> | Partial<ethers.providers.TransactionReceipt> = {
      nonce: 0,
      gasLimit: ethers.BigNumber.from(21000),
      gasPrice: ethers.BigNumber.from(1000000000),
      to: createAddress("0x67"),
      value: ethers.BigNumber.from(1000000000),
      data: "0x",
      chainId: 1,
      from: createAddress("0x87"),
      timestamp: Date.now(),
      blockHash: ethers.utils.keccak256("0x1234"),
      blockNumber: 1337,
      confirmations: 1,
      maxFeePerGas: ethers.BigNumber.from(1000000000),
      logsBloom: "0x",
      logs: [],
      cumulativeGasUsed: ethers.BigNumber.from(21000),
      type: 1,
    };

    mockTransactionData.setTransactionResponse(txParams);
    mockTransactionData.setTransactionReceipt(txParams as Partial<ethers.providers.TransactionReceipt>);

    mockProvider.setTransaction(mockTransactionData);

    const transactionResponse: ethers.providers.TransactionResponse = await mockProvider.getTransaction(
      mockTransactionData.hash
    );
    const transactionReceipt: ethers.providers.TransactionReceipt = await mockProvider.getTransactionReceipt(
      mockTransactionData.hash
    );

    expect(transactionResponse).toStrictEqual(mockTransactionData.getTransactionResponse());
    expect(transactionReceipt).toStrictEqual(mockTransactionData.getTransactionReceipt());
  });
});
