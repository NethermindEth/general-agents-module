import { createAddress, MockEthersProvider } from "./tests";
import { MULTICALL2_ABI, MulticallContract, MulticallProvider } from "./multicall.provider";
import { ContractCall } from "ethers-multicall";
import { ethers } from "forta-agent";

describe("MulticallProvider test suite", () => {
  const MULTICALL_IFACE = new ethers.utils.Interface(MULTICALL2_ABI);

  const mockEthersProvider: MockEthersProvider = new MockEthersProvider();
  let mockMulticallProvider: MockEthersProvider;

  const TEST_MULTICALL2_ADDRESSES: Record<number, string> = {
    0: createAddress("0xffe"), // networkId and multicall2 address used for tests
  };

  const TEST_ABI = [
    "function func1() external view returns (uint)",
    "function func2() external view returns (uint)",
    "function func3(uint) external view returns (uint)",
    "function func4(address) external view returns (uint)",
  ];
  const TEST_IFACE = new ethers.utils.Interface(TEST_ABI);

  const TEST_BLOCKS = [12, 13, 15, 22];

  const TEST_ADDR = createAddress("0xa1");
  const contract = new MulticallContract(TEST_ADDR, TEST_ABI);

  const TEST_CALLS: ContractCall[] = [
    contract.func1(),
    contract.func2(),
    contract.func3(ethers.BigNumber.from(5)),
    contract.func4(createAddress("0xb1")),
  ];

  const TEST_OUTPUTS = TEST_CALLS.map((call) => ethers.BigNumber.from(ethers.utils.formatBytes32String(call.name)));

  const addCallTo = (block: number | string, indexes: number[], inputs: any[]) => {
    for (let index of indexes) {
      mockMulticallProvider.addCallTo(TEST_ADDR, block, TEST_IFACE, TEST_CALLS[index].name, {
        inputs: TEST_CALLS[index].params,
        outputs: [TEST_OUTPUTS[index]],
      });
    }
  };

  const generateMockProviderCall = () => {
    const _call = mockEthersProvider.call;

    mockEthersProvider.call = jest.fn().mockImplementation(({ data, to, from }, blockTag) => {
      if (to.toLowerCase() === TEST_MULTICALL2_ADDRESSES[0]) {
        const args = MULTICALL_IFACE.decodeFunctionData("tryAggregate", data) as [
          requireSuccess: boolean,
          calls: Array<{
            callData: string;
            target: string;
          }>
        ];
        const results = args[1].map((call) => {
          const res = mockMulticallProvider.call({ data: call.callData, to: call.target }, blockTag);
          if (!res && args[0]) throw Error("Call failed");
          return { success: Boolean(res), returnData: res ? res : "0x" };
        });

        return MULTICALL_IFACE.encodeFunctionResult("tryAggregate", [results]);
      } else {
        return _call({ data, to, from });
      }
    });
  };

  // generate sub arrays of the initial one, following `destribution`.
  const generateStructuredArray = (array: any[], destribution: number[]): any[][] => {
    // note that sum(destribution) should be equals to calls.length
    const structuredArray = [];
    let i = 0;
    for (let dest of destribution) {
      structuredArray.push(array.slice(i, i + dest));
      i += dest;
    }
    return structuredArray;
  };
  const TEST_DESTRIBUTIONS = [[1, 1, 1, 1], [2, 2], [3, 1], [4]];

  let multicallProvider: MulticallProvider;

  beforeAll(() => {
    mockMulticallProvider = new MockEthersProvider();

    // @ts-expect-error (this can be changed to setNetwork in v3)
    mockEthersProvider.getNetwork = jest.fn().mockReturnValue(Promise.resolve({ chainId: 0 }));

    MulticallProvider.setMulticall2Addresses(TEST_MULTICALL2_ADDRESSES);
    multicallProvider = new MulticallProvider(mockEthersProvider as unknown as ethers.providers.Provider, 0);

    generateMockProviderCall();
  });

  beforeEach(() => {
    mockMulticallProvider.clear();
    mockEthersProvider.clear();
  });

  describe("init", () => {
    it("should get the correct address when calling init", async () => {
      const multicallProvider = new MulticallProvider(mockEthersProvider as unknown as ethers.providers.Provider);

      await multicallProvider.init();

      expect(multicallProvider["_multicallAddress"]).toBe(TEST_MULTICALL2_ADDRESSES[0]);
    });
  });

  describe("all", () => {
    it("should return false when one of the calls fails", async () => {
      addCallTo(TEST_BLOCKS[0], [0, 1, 2], []);

      const response = await multicallProvider.all(TEST_CALLS, TEST_BLOCKS[0]);
      expect(response).toStrictEqual([false, []]);
    });

    it("should return expected results and success flag when all calls succeed", async () => {
      addCallTo(TEST_BLOCKS[0], [0, 1, 2, 3], []);

      const response = await multicallProvider.all(TEST_CALLS, TEST_BLOCKS[0]);

      expect(response).toStrictEqual([true, TEST_OUTPUTS]);
    });
  });

  describe("tryAll", () => {
    it("should return expected results when all calls fail", async () => {
      const response = await multicallProvider.tryAll(TEST_CALLS, TEST_BLOCKS[1]);
      expect(response).toStrictEqual(TEST_CALLS.map(() => Object({ success: false, returnData: [] })));
    });

    it("should return expected results when all calls succeed", async () => {
      addCallTo(TEST_BLOCKS[2], [0, 1, 2, 3], []);

      const response = await multicallProvider.tryAll(TEST_CALLS, TEST_BLOCKS[2]);
      expect(response).toStrictEqual([
        { success: true, returnData: TEST_OUTPUTS[0] },
        { success: true, returnData: TEST_OUTPUTS[1] },
        { success: true, returnData: TEST_OUTPUTS[2] },
        { success: true, returnData: TEST_OUTPUTS[3] },
      ]);
    });

    it("should return expected results when some of the calls fail", async () => {
      addCallTo(TEST_BLOCKS[3], [0, 2], []);

      const response = await multicallProvider.tryAll(TEST_CALLS, TEST_BLOCKS[3]);
      expect(response).toStrictEqual([
        { success: true, returnData: TEST_OUTPUTS[0] },
        { success: false, returnData: [] },
        { success: true, returnData: TEST_OUTPUTS[2] },
        { success: false, returnData: [] },
      ]);
    });
  });

  describe("groupAll", () => {
    it("should preserve the inputs structure when all calls succeed", async () => {
      for (let dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);
        addCallTo(TEST_BLOCKS[0], [0, 1, 2, 3], []);

        const response = await multicallProvider.groupAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual([true, generateStructuredArray(TEST_OUTPUTS, dest)]);
      }
    });

    it("should return expected results when one of calls fail", async () => {
      for (let dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);
        addCallTo(TEST_BLOCKS[0], [0, 1, 2], []);

        const response = await multicallProvider.groupAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual([false, []]);
      }
    });
  });

  describe("groupTryAll", () => {
    it("should preserve the inputs structure when all calls succeed", async () => {
      for (let dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);
        addCallTo(TEST_BLOCKS[0], [0, 1, 2, 3], []);

        const response = await multicallProvider.groupTryAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual(
          generateStructuredArray(
            TEST_OUTPUTS.map((output) => Object({ success: true, returnData: output })),
            dest
          )
        );
      }
    });

    it("should return expected results when all calls fail", async () => {
      for (let dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);

        const response = await multicallProvider.groupTryAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual(
          generateStructuredArray(
            TEST_CALLS.map(() => Object({ success: false, returnData: [] })),
            dest
          )
        );
      }
    });

    it("should preserve the inputs structure when some of calls fail", async () => {
      for (let dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);

        addCallTo(TEST_BLOCKS[0], [0, 3], []);

        const response = await multicallProvider.groupTryAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual(
          generateStructuredArray(
            [
              { success: true, returnData: TEST_OUTPUTS[0] },
              { success: false, returnData: [] },
              { success: false, returnData: [] },
              { success: true, returnData: TEST_OUTPUTS[3] },
            ],
            dest
          )
        );
      }
    });
  });
});
