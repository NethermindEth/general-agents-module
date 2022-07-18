import { MockEthersProvider } from "../test";
import { createAddress } from ".";
import { MULTICALL2_ABI, MulticallContract, MulticallProvider } from "./multicall.provider";
import { ContractCall } from "ethers-multicall";
import { ethers } from "forta-agent";

describe("MulticallProvider test suite", () => {
  const MULTICALL_IFACE = new ethers.utils.Interface(MULTICALL2_ABI);

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
    for (const index of indexes) {
      mockEthersProvider.addCallTo(TEST_ADDR, block, TEST_IFACE, TEST_CALLS[index].name, {
        inputs: TEST_CALLS[index].params,
        outputs: [TEST_OUTPUTS[index]],
      });
    }
  };

  const generateMockProviderCall = () => {
    const _call = mockEthersProvider.call;

    mockEthersProvider.call = jest.fn().mockImplementation(async ({ data, to, from }, blockTag) => {
      if (to.toLowerCase() === TEST_MULTICALL2_ADDRESSES[0]) {
        const args = MULTICALL_IFACE.decodeFunctionData("tryAggregate", data) as [
          requireSuccess: boolean,
          calls: Array<{
            callData: string;
            target: string;
          }>
        ];

        const outputs = await Promise.all(
          args[1].map(async (call) => {
            try {
              const output = await mockEthersProvider.call({ data: call.callData, to: call.target }, blockTag);
              return output;
            } catch {
              return null;
            }
          })
        );

        const results = outputs.map((output) => {
          if (!output && args[0]) throw Error("Call failed");

          return { success: output !== null, returnData: output !== null ? output : "0x" };
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
    for (const dest of destribution) {
      structuredArray.push(array.slice(i, i + dest));
      i += dest;
    }
    return structuredArray;
  };

  const TEST_DESTRIBUTIONS = [[1, 1, 1, 1], [2, 2], [3, 1], [4]];

  let multicallProvider: MulticallProvider;
  let mockEthersProvider: MockEthersProvider;

  beforeAll(() => {
    mockEthersProvider = new MockEthersProvider();
    mockEthersProvider.setNetwork(0);

    generateMockProviderCall();

    MulticallProvider.setMulticall2Addresses(TEST_MULTICALL2_ADDRESSES);
    multicallProvider = new MulticallProvider(mockEthersProvider as unknown as ethers.providers.Provider, 0);
  });

  beforeEach(() => {
    mockEthersProvider.clear();
    mockEthersProvider.setNetwork(0);
  });

  describe("constructor", () => {
    it("should get the correct Multicall2 address when specifying the chain ID", async () => {
      const multicallProvider = new MulticallProvider(mockEthersProvider as unknown as ethers.providers.Provider, 0);

      expect(multicallProvider["_multicallAddress"]).toBe(TEST_MULTICALL2_ADDRESSES[0]);
    });

    it("should throw an error if there's no known Multicall2 address for a chain ID", async () => {
      expect(() => {
        new MulticallProvider(mockEthersProvider as unknown as ethers.providers.Provider, 500);
      }).toThrowError(
        "Unsupported chain ID: 500. Please set a Multicall2 address for it through MulticallProvider.setMulticall2Addresses()"
      );
    });
  });

  describe("init", () => {
    it("should get the correct Multicall2 address when calling init", async () => {
      const multicallProvider = new MulticallProvider(mockEthersProvider as unknown as ethers.providers.Provider);

      await multicallProvider.init();

      expect(multicallProvider["_multicallAddress"]).toBe(TEST_MULTICALL2_ADDRESSES[0]);
    });

    it("should throw an error if there's no known Multicall2 address for a chain ID", async () => {
      const multicallProvider = new MulticallProvider(mockEthersProvider as unknown as ethers.providers.Provider);
      mockEthersProvider.setNetwork(500);

      await expect(multicallProvider.init()).rejects.toEqual(
        new Error(
          "Unsupported chain ID: 500. Please set a Multicall2 address for it through MulticallProvider.setMulticall2Addresses()"
        )
      );
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
      expect(response).toStrictEqual(TEST_CALLS.map(() => ({ success: false, returnData: [] })));
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
      for (const dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);
        addCallTo(TEST_BLOCKS[0], [0, 1, 2, 3], []);

        const response = await multicallProvider.groupAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual([true, generateStructuredArray(TEST_OUTPUTS, dest)]);
      }
    });

    it("should return expected results when one of calls fail", async () => {
      for (const dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);
        addCallTo(TEST_BLOCKS[0], [0, 1, 2], []);

        const response = await multicallProvider.groupAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual([false, []]);
      }
    });
  });

  describe("groupTryAll", () => {
    it("should preserve the inputs structure when all calls succeed", async () => {
      for (const dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);
        addCallTo(TEST_BLOCKS[0], [0, 1, 2, 3], []);

        const response = await multicallProvider.groupTryAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual(
          generateStructuredArray(
            TEST_OUTPUTS.map((output) => ({ success: true, returnData: output })),
            dest
          )
        );
      }
    });

    it("should return expected results when all calls fail", async () => {
      for (const dest of TEST_DESTRIBUTIONS) {
        const groupCalls = generateStructuredArray(TEST_CALLS, dest);

        const response = await multicallProvider.groupTryAll(groupCalls, TEST_BLOCKS[0]);
        expect(response).toStrictEqual(
          generateStructuredArray(
            TEST_CALLS.map(() => ({ success: false, returnData: [] })),
            dest
          )
        );
      }
    });

    it("should preserve the inputs structure when some of calls fail", async () => {
      for (const dest of TEST_DESTRIBUTIONS) {
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
