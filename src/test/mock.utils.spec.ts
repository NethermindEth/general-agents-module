import { MockEthersProvider, MockEthersSigner } from "./mock.utils";
import { createAddress } from "../utils";
import { utils, Contract } from "ethers";
import { Interface } from "@ethersproject/abi";
import { leftPad } from "web3-utils";

describe("Ethers mocks tests", () => {
  describe("MockEthersProvider tests suite", () => {
    const mockProvider: MockEthersProvider = new MockEthersProvider();

    beforeEach(() => mockProvider.clear());

    it("should return the correct storage", async () => {
      const CASES: [string, number, number, string][] = [
        ["0xdef10", 1, 0, "0xe0a0"],
        ["0xdef11", 21, 70, "0xe0a1"],
        ["0xdef12", 100, 99, "0xe0a2"],
        ["0xdef13", 4, 201, "0xe0a3"],
        ["0xdef14", 42, 1234, "0xe0a4"],
      ];

      for (let [shortContract, slot, block, shortAddr] of CASES) {
        const encodedSlot: string = leftPad(shortAddr, 64);
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
  });

  describe("MockEthersSigner tests suite", () => {
    const mockProvider: MockEthersProvider = new MockEthersProvider();
    const mockSigner: MockEthersSigner = new MockEthersSigner(mockProvider);

    beforeEach(() => {
      mockSigner.clear();
      mockProvider.clear();
    });

    it("should return the correct address", async () => {
      const CASES: string[] = [
        createAddress("0xf00d"),
        createAddress("0xdead"),
        createAddress("0xabcdef"),
        createAddress("0xe0a"),
      ];

      for (let addr of CASES) {
        mockSigner.setAddress(addr);

        // check the storage twice
        expect(await mockSigner.getAddress()).toStrictEqual(addr);
        expect(await mockSigner.getAddress()).toStrictEqual(addr);
      }
    });

    it("should return deny txns", async () => {
      const iface: Interface = new Interface(["function deposit(uint256 amount)", "function withdraw(uint256 amount)"]);

      const CASES: [string, string, string, number, string][] = [
        [createAddress("0xbade0a0"), createAddress("0xdef13"), "withdraw", 213, "wtf!"],
        [createAddress("0xbade0a1"), createAddress("0xdef12"), "deposit", 222, "ohhh"],
        [createAddress("0xbade0a2"), createAddress("0xdef11"), "deposit", 231, "wao"],
        [createAddress("0xbade0a3"), createAddress("0xdef10"), "withdraw", 240, "rejected!"],
      ];

      for (let [from, to, id, amount, msg] of CASES) {
        mockSigner.setAddress(from).denyTransaction(from, to, iface, id, [amount], msg);

        const contract: Contract = new Contract(to, iface, mockSigner as any);
        // check the denial two times
        expect(contract[id](amount)).rejects.toMatch(msg);
        expect(contract[id](amount)).rejects.toMatch(msg);
      }
    });

    it("should return allow txns", async () => {
      const iface: Interface = new Interface([
        "function depositV2(string amount)",
        "function withdrawV2(string amount)",
      ]);

      const CASES: [string, string, string, string, any][] = [
        [createAddress("0xbade0a0"), createAddress("0xdef13"), "withdrawV2", "213", { confirmations: 20 }],
        [createAddress("0xbade0a1"), createAddress("0xdef12"), "depositV2", "222", { confirmations: 1 }],
        [createAddress("0xbade0a2"), createAddress("0xdef11"), "depositV2", "231", { confirmations: 200 }],
        [createAddress("0xbade0a3"), createAddress("0xdef10"), "withdrawV2", "240", { confirmations: 42 }],
      ];

      for (let [from, to, id, amount, receipt] of CASES) {
        mockSigner.setAddress(from).allowTransaction(from, to, iface, id, [amount], receipt);

        const contract: Contract = new Contract(to, iface, mockSigner as any);
        // check the denial two times
        expect((await contract[id](amount)).wait()).resolves.toStrictEqual({
          events: [],
          logs: [],
          ...receipt,
        });
        expect((await contract[id](amount)).wait()).resolves.toStrictEqual({
          events: [],
          logs: [],
          ...receipt,
        });
      }
    });

    it("should use the provider correctly", async () => {
      const iface: utils.Interface = new utils.Interface([
        "function foo(uint256 val, string a, string b) external view returns (string id1, string id2)",
      ]);
      const signer: string = createAddress("0xe0a");
      const contractAddress: string = createAddress("0xbade0a");
      mockProvider.addCallFrom(contractAddress, signer, 42, iface, "foo", {
        inputs: [1, "a", "b"],
        outputs: ["20", "10"],
      });
      mockSigner.setAddress(signer);

      const contract: Contract = new Contract(contractAddress, iface, mockSigner as any);

      const { id1, id2 } = await contract.foo(1, "a", "b", { blockTag: 42 });
      expect([id1, id2]).toStrictEqual(["20", "10"]);
    });
  });
});
