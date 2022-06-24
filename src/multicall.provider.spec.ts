import { createAddress, MockEthersProvider } from "./tests";
import { MULTICALL2_ABI, MulticallContract, MulticallProvider } from "./multicall.provider";
import { formatBytes32String, Interface } from "ethers/lib/utils";
import { ContractCall } from "ethers-multicall";
import { Abi } from "ethers-multicall/dist/abi";
import { BigNumber } from "ethers";

describe("MulticallProvider test suite", () => {
  const mockEthersProvider = new MockEthersProvider();
  const TEST_MULTICALL2_ADDRESSES: Record<number, string> = {
    0: "0x5ba1e12693dc8f9c48aad8770482f4739beed696", // netowrkId and multicall2 address used for tests
  };

  const TEST_ABI = [
    "function func1() external view returns (uint)",
    "function func2() external view returns (uint)",
    "function func3(uint) external view returns (uint)",
    "function func4(address) external view returns (uint)",
  ];
  const TEST_ADDR = createAddress("0xa1");

  const TEST_BATCH_SIZE = 10;
  const TEST_BLOCKS = [12, 13, 15, 22];

  const contract = new MulticallContract(TEST_ADDR, TEST_ABI);

  const TEST_CALLS: ContractCall[] = [
    contract.func1(),
    contract.func2(),
    contract.func3(BigNumber.from(5)),
    contract.func4(createAddress("0xb1")),
  ];
  // test returned value for each call of TEST_CALLS.
  const TEST_OUTPUTS: string[] = TEST_CALLS.map((call) => formatBytes32String(call.name));

  const TEST_GROUP_CALLS: ContractCall[][] = [
    [contract.func1(), contract.func2()],
    [contract.func3(BigNumber.from(5))],
    [contract.func4(createAddress("0xb1"))],
  ];

  // adds a provider call to tryAggregate
  const addCallTo = (
    block: number | string,
    requireSuccess: boolean,
    calls: ContractCall[],
    successFlags: boolean[]
  ) => {
    const requests = calls.map((call) => ({
      target: call.contract.address,
      callData: Abi.encode(call.name, call.inputs, call.params),
    }));
    const outputs = [];
    for (let i = 0; i < calls.length; i++) {
      outputs.push({ success: successFlags[i], returnData: formatBytes32String(calls[i].name) });
    }

    mockEthersProvider.addCallTo(
      "0x5ba1e12693dc8f9c48aad8770482f4739beed696",
      block,
      new Interface(MULTICALL2_ABI),
      "tryAggregate",
      {
        inputs: [requireSuccess, requests],
        outputs: [outputs],
      }
    );
  };

  let multicallProvider: MulticallProvider;

  beforeAll(() => {
    multicallProvider = new MulticallProvider(mockEthersProvider as any, 0, TEST_MULTICALL2_ADDRESSES, TEST_BATCH_SIZE);
  });

  beforeEach(() => {
    mockEthersProvider.clear();
  });

  describe("all", () => {
    it("should return false when one of the calls fails", async () => {
      // we do not create a call for 4th entry to make it fail.
      addCallTo(TEST_BLOCKS[0], true, TEST_CALLS.slice(0, -1), [true, true, true]);

      const response = await multicallProvider.all(TEST_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([false, []]);
    });

    it("should return expected results and success flag when all calls succeed", async () => {
      addCallTo(TEST_BLOCKS[0], true, TEST_CALLS, [true, true, true, true]);
      const response = await multicallProvider.all(TEST_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([true, TEST_OUTPUTS.map((output) => BigNumber.from(output))]);
    });
  });

  describe("tryAll", () => {
    it("should return expected results when all calls fail", async () => {
      addCallTo(TEST_BLOCKS[1], false, TEST_CALLS, [false, false, false, false]);
      const response = await multicallProvider.tryAll(TEST_CALLS, TEST_BLOCKS[1]);
      expect(response).toStrictEqual([
        { success: false, returnData: "0x" },
        { success: false, returnData: "0x" },
        { success: false, returnData: "0x" },
        { success: false, returnData: "0x" },
      ]);
    });

    it("should return expected results when all calls succeed", async () => {
      addCallTo(TEST_BLOCKS[2], false, TEST_CALLS, [true, true, true, true]);
      const response = await multicallProvider.tryAll(TEST_CALLS, TEST_BLOCKS[2]);
      expect(response).toStrictEqual([
        { success: true, returnData: BigNumber.from(TEST_OUTPUTS[0]) },
        { success: true, returnData: BigNumber.from(TEST_OUTPUTS[1]) },
        { success: true, returnData: BigNumber.from(TEST_OUTPUTS[2]) },
        { success: true, returnData: BigNumber.from(TEST_OUTPUTS[3]) },
      ]);
    });

    it("should return expected results when some of the calls fail", async () => {
      addCallTo(TEST_BLOCKS[3], false, TEST_CALLS, [true, false, true, false]);
      const response = await multicallProvider.tryAll(TEST_CALLS, TEST_BLOCKS[3]);
      expect(response).toStrictEqual([
        { success: true, returnData: BigNumber.from(TEST_OUTPUTS[0]) },
        { success: false, returnData: "0x" },
        { success: true, returnData: BigNumber.from(TEST_OUTPUTS[2]) },
        { success: false, returnData: "0x" },
      ]);
    });
  });
  describe("groupAll", () => {
    it("should preserve the inputs structure when all calls succeed", async () => {
      addCallTo(TEST_BLOCKS[0], true, TEST_GROUP_CALLS.flat(), [true, true, true, true]);
      const response = await multicallProvider.groupAll(TEST_GROUP_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([
        true,
        [
          [BigNumber.from(TEST_OUTPUTS[0]), BigNumber.from(TEST_OUTPUTS[1])],
          [BigNumber.from(TEST_OUTPUTS[2])],
          [BigNumber.from(TEST_OUTPUTS[3])],
        ],
      ]);
    });
    it("should return expected results when one of calls fail", async () => {
      addCallTo(TEST_BLOCKS[0], true, TEST_CALLS.slice(0, -1), [true, true, true]); // 4th call will fail
      const response = await multicallProvider.groupAll(TEST_GROUP_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([false, []]);
    });
  });
  describe("groupTryAll", () => {
    it("should preserve the inputs structure when all calls succeed", async () => {
      addCallTo(TEST_BLOCKS[0], false, TEST_GROUP_CALLS.flat(), [true, true, true, true]);
      const response = await multicallProvider.groupTryAll(TEST_GROUP_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([
        [
          { success: true, returnData: BigNumber.from(TEST_OUTPUTS[0]) },
          { success: true, returnData: BigNumber.from(TEST_OUTPUTS[1]) },
        ],
        [{ success: true, returnData: BigNumber.from(TEST_OUTPUTS[2]) }],
        [{ success: true, returnData: BigNumber.from(TEST_OUTPUTS[3]) }],
      ]);
    });

    it("should return expected results when all calls fail", async () => {
      addCallTo(TEST_BLOCKS[0], false, TEST_CALLS, [false, false, false, false]);
      const response = await multicallProvider.groupTryAll(TEST_GROUP_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([
        [
          { success: false, returnData: "0x" },
          { success: false, returnData: "0x" },
        ],
        [{ success: false, returnData: "0x" }],
        [{ success: false, returnData: "0x" }],
      ]);
    });
    it("should preserve the inputs structure when some of calls fail", async () => {
      addCallTo(TEST_BLOCKS[0], false, TEST_CALLS, [true, false, false, true]);
      const response = await multicallProvider.groupTryAll(TEST_GROUP_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([
        [
          { success: true, returnData: BigNumber.from(TEST_OUTPUTS[0]) },
          { success: false, returnData: "0x" },
        ],
        [{ success: false, returnData: "0x" }],
        [{ success: true, returnData: BigNumber.from(TEST_OUTPUTS[3]) }],
      ]);
    });
  });
});
