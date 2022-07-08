import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { Transaction } from "@ethersproject/transactions";
import { ethers } from "forta-agent";
import { when } from "jest-when";
import { createAddress } from ".";
import { MockEthersProvider } from "../test";
import { CachedProvider, CachedProviderOptions } from "./cached_provider";

class ExtendedMockEthersProvider extends MockEthersProvider {
  internalBlockNumber: number = 0;

  public setInternalBlockNumber(blockNumber: number) {
    this.internalBlockNumber = blockNumber;
  }

  private async _getTransactionRequest(transaction: Deferrable<TransactionRequest>): Promise<Transaction> {
    const _getTransactionRequest = ethers.providers.BaseProvider.prototype._getTransactionRequest.bind({
      formatter: ethers.providers.BaseProvider.getFormatter(),
      async _getAddress(address: string | Promise<string>): Promise<string> {
        return await address;
      },
    });

    return await _getTransactionRequest(transaction);
  }

  private async _getBlockTag(blockTag: BlockTag | Promise<BlockTag>): Promise<BlockTag> {
    const internalBlockNumber = this.internalBlockNumber;

    const _getBlockTag = ethers.providers.BaseProvider.prototype._getBlockTag.bind({
      formatter: ethers.providers.BaseProvider.getFormatter(),
      pollingInterval: 0,
      _getInternalBlockNumber(maxAge: number): number {
        return internalBlockNumber;
      },
    });

    return await _getBlockTag(blockTag);
  }
}

const OPTIONS: CachedProviderOptions = {
  blockDataCacheSize: 10,
  immutableDataCacheSize: 10,
};

const cacheKey = (to: string, data: string, blockTag: number | string, cacheByBlockTag: boolean): string => {
  const block = cacheByBlockTag ? ethers.utils.hexValue(blockTag).slice(2) : "";
  const isOddLength = (to.length + data.length + block.length) & 1;
  return Buffer.from(`${to.slice(2)}${isOddLength ? "0" : ""}${block}${data.slice(2)}`, "hex").toString("base64");
};

const TEST_IFACE = new ethers.utils.Interface([
  "function test1()",
  "function test2(uint256)",
  "function test3() returns (uint256)",
  "function test4(uint256) returns (uint256)",
]);
const TEST_ADDRESS = createAddress("0x1");

describe("CachedProvider tests suite", () => {
  let mockProvider: ExtendedMockEthersProvider;
  let provider: ethers.providers.BaseProvider;
  let cachedProvider: ethers.providers.Provider;

  const addCalls = (
    test2Param: string,
    test3Return: string,
    test4Param: string,
    test4Return: string,
    blockTag: BlockTag
  ) => {
    mockProvider.addCallTo(TEST_ADDRESS, blockTag, TEST_IFACE, "test1", { inputs: [], outputs: [] });
    mockProvider.addCallTo(TEST_ADDRESS, blockTag, TEST_IFACE, "test2", {
      inputs: [ethers.BigNumber.from(test2Param)],
      outputs: [],
    });
    mockProvider.addCallTo(TEST_ADDRESS, blockTag, TEST_IFACE, "test3", {
      inputs: [],
      outputs: [ethers.BigNumber.from(test3Return)],
    });
    mockProvider.addCallTo(TEST_ADDRESS, blockTag, TEST_IFACE, "test4", {
      inputs: [ethers.BigNumber.from(test4Param)],
      outputs: [ethers.BigNumber.from(test4Return)],
    });

    return [
      {
        data: TEST_IFACE.encodeFunctionData("test1", []),
        result: TEST_IFACE.encodeFunctionResult("test1", []),
      },
      {
        data: TEST_IFACE.encodeFunctionData("test2", [ethers.BigNumber.from(test2Param)]),
        result: TEST_IFACE.encodeFunctionResult("test2", []),
      },
      {
        data: TEST_IFACE.encodeFunctionData("test3", []),
        result: TEST_IFACE.encodeFunctionResult("test3", [ethers.BigNumber.from(test3Return)]),
      },
      {
        data: TEST_IFACE.encodeFunctionData("test4", [ethers.BigNumber.from(test4Param)]),
        result: TEST_IFACE.encodeFunctionResult("test4", [ethers.BigNumber.from(test4Return)]),
      },
    ];
  };

  beforeEach(() => {
    mockProvider = new ExtendedMockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.BaseProvider;
    cachedProvider = CachedProvider.from(provider);

    CachedProvider.set(OPTIONS);
  });

  it("should proxy properties from the original provider and return a modified version of call()", () => {
    const provider = new ethers.providers.JsonRpcProvider("test", 1);
    const cachedProvider = CachedProvider.from(provider);

    for (const key in provider) {
      const member = key as keyof ethers.providers.JsonRpcProvider;

      if (key !== "call") {
        expect(cachedProvider[member]).toStrictEqual(provider[member]);
      } else {
        expect(typeof cachedProvider[member]).toBe("function");
        expect(cachedProvider[member]).not.toStrictEqual(provider.call);
      }
    }
  });

  it("should proxy directly (also not caching) calls made with latest or decimal block tags and calls made without a to address", async () => {
    let encodedInfos = addCalls("1", "2", "3", "4", "latest");

    await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfos[0].data }, "latest");

    expect(CachedProvider["blockDataCache"].size).toBe(0);
    expect(CachedProvider["immutableDataCache"]).toBeUndefined();

    encodedInfos = addCalls("1", "2", "3", "4", 0.1);

    // this wouldn't work in a real provider, but in the mock provider a call with 0.1 block will not fail if
    // the added call block tag is also 0.1
    await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfos[0].data }, 0.1);

    expect(CachedProvider["blockDataCache"].size).toBe(0);
    expect(CachedProvider["immutableDataCache"]).toBeUndefined();

    when(mockProvider.call).calledWith({ data: "0x" }, 0).mockReturnValue(Promise.resolve("0x"));
    await cachedProvider.call({ data: "0x" }, 0);

    expect(CachedProvider["blockDataCache"].size).toBe(0);
    expect(CachedProvider["immutableDataCache"]).toBeUndefined();
  });

  it("should cache a call with valid block tag if cacheByBlockTag is set", async () => {
    const encodedInfos = addCalls("1", "2", "3", "4", 1);

    let expectedCacheSize = 0;
    for (const encodedInfo of encodedInfos) {
      expect(await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfo.data }, 1)).toBe(encodedInfo.result);

      expect(CachedProvider["blockDataCache"].size).toBe(++expectedCacheSize);
      expect(CachedProvider["blockDataCache"].has(cacheKey(TEST_ADDRESS, encodedInfo.data, 1, true))).toBe(true);
    }

    expect(CachedProvider["immutableDataCache"]).toBeUndefined();
  });

  it("should cache a call with valid block tag if cacheByBlockTag is not set", async () => {
    cachedProvider = CachedProvider.from(provider, false);
    const encodedInfos = addCalls("5", "6", "7", "8", 1);

    let expectedCacheSize = 0;
    for (const encodedInfo of encodedInfos) {
      expect(await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfo.data }, 1)).toBe(encodedInfo.result);

      expect(CachedProvider["immutableDataCache"].size).toBe(++expectedCacheSize);
      expect(CachedProvider["immutableDataCache"].has(cacheKey(TEST_ADDRESS, encodedInfo.data, 1, false))).toBe(true);
    }

    expect(CachedProvider["blockDataCache"]).not.toBeUndefined();
  });
});
