import { MockEthersProvider } from "./mock.utils";
import { createAddress } from "./tests.utils";
import { encodeParameter } from "./utils";
import { utils, Contract } from "ethers";

describe("MockEthersProvider tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  beforeEach(() => mockProvider.clear());

  it("should return the correct storage", () => {
    const CASES: [string, number, number, string][] = [
      ["0xdef10", 1, 0, "0xe0a0"],
      ["0xdef11", 21, 70, "0xe0a1"],
      ["0xdef12", 100, 99, "0xe0a2"],
      ["0xdef13", 4, 201, "0xe0a3"],
      ["0xdef14", 42, 1234, "0xe0a4"],
    ];

    for(let [shortContract, slot, block, shortAddr] of CASES) {
      const encodedSlot: string = encodeParameter("address", createAddress(shortAddr));
      const contract: string = createAddress(shortContract);

      mockProvider.addStorage(contract, slot, block, encodedSlot);

      // check the storage twice
      expect(mockProvider.getStorageAt(contract, slot, block)).toStrictEqual(encodedSlot);
      expect(mockProvider.getStorageAt(contract, slot, block)).toStrictEqual(encodedSlot);
    }
  });

  it("should return the correct block", () => {
    const CASES: Record<string, any>[] = [
      { difficulty: 200, number: 25, timestamp: 31},
      { difficulty: 50, number: 212, timestamp: 3131},
      { difficulty: 4020, number: 2, timestamp: 888},
      { difficulty: 7, number: 1789, timestamp: 1},
    ];

    for(let block of CASES) {
      mockProvider.addBlock(block.number, block);

      // check the block twice
      expect(mockProvider.getBlock(block.number)).toStrictEqual(block);
      expect(mockProvider.getBlock(block.number)).toStrictEqual(block);
    }
  });

  it("should return the correct output in the calls", async () => {
    const iface: utils.Interface = new utils.Interface([
      "function foo(uint256 val, string a, string b) external view returns (uint256 id1, uint256 id2)",
      "function details(uint256 user_id) external view returns (string user_data)",
      "function something(bytes _bytes) external view returns (string _string, bytes _id)",
    ])

    const listMatch = (listA: any[], listB: any[]) => {
      for(let i = 0; i < listB.length; ++i)
        expect(listA[i].toString()).toStrictEqual(listB[i].toString());
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

    for(let [shortContract, id, inputs, outputs, block] of CASES) {
      const contract: string = createAddress(shortContract);
      mockProvider.addCallTo(
        contract, block, iface,
        id, { inputs, outputs},
      );

      const ethersContract: Contract = new Contract(contract, iface, mockProvider as any);

      // check the call twice
      let returnedValue: any = await ethersContract[id](...inputs, { blockTag: block });
      if(outputs.length > 1) listMatch(returnedValue, outputs);
      else valueMatch(returnedValue, outputs);

      returnedValue = await ethersContract[id](...inputs, { blockTag: block });
      if(outputs.length > 1) listMatch(returnedValue, outputs);
      else valueMatch(returnedValue, outputs);
    }
  });
});
