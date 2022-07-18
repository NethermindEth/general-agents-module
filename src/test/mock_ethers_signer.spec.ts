import { utils, Contract } from "ethers";
import { Interface } from "@ethersproject/abi";
import { createAddress } from "../utils";
import MockEthersProvider from "./mock_ethers_provider";
import MockEthersSigner from "./mock_ethers_signer";

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
    const iface: Interface = new Interface(["function depositV2(string amount)", "function withdrawV2(string amount)"]);

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
