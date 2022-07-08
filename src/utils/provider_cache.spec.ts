import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { Transaction } from "@ethersproject/transactions";
import { ethers } from "forta-agent";
import { when } from "jest-when";
import { createAddress } from ".";
import { MockEthersProvider } from "../test";
import { ProviderCache, ProviderCacheOptions } from "./provider_cache";

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

const OPTIONS: ProviderCacheOptions = {
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

describe("ProviderCache tests suite", () => {
  let mockProvider: ExtendedMockEthersProvider;
  let provider: ethers.providers.BaseProvider;

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

  beforeAll(() => {
    ProviderCache.set(OPTIONS);
  });

  beforeEach(() => {
    mockProvider = new ExtendedMockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.BaseProvider;

    // resetting caches as it would be when creating the first proxy
    ProviderCache["blockDataCache"] = undefined;
    ProviderCache["immutableDataCache"] = undefined;
  });

  it("should proxy properties from the original provider and return a modified version of call()", () => {
    const provider = new ethers.providers.JsonRpcProvider("test", 1);
    const cachedProvider = ProviderCache.createProxy(provider);

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
    const cachedProvider = ProviderCache.createProxy(provider);
    let encodedInfos = addCalls("1", "2", "3", "4", "latest");

    await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfos[0].data }, "latest");

    expect(ProviderCache["blockDataCache"]!.size).toBe(0);
    expect(ProviderCache["immutableDataCache"]).toBeUndefined();

    encodedInfos = addCalls("1", "2", "3", "4", 0.1);

    // this wouldn't work in a real provider, but in the mock provider a call with 0.1 block will not fail if
    // the added call block tag is also 0.1
    await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfos[0].data }, 0.1);

    expect(ProviderCache["blockDataCache"]!.size).toBe(0);
    expect(ProviderCache["immutableDataCache"]).toBeUndefined();

    when(mockProvider.call).calledWith({ data: "0x" }, 0).mockReturnValue(Promise.resolve("0x"));
    await cachedProvider.call({ data: "0x" }, 0);

    expect(ProviderCache["blockDataCache"]!.size).toBe(0);
    expect(ProviderCache["immutableDataCache"]).toBeUndefined();
  });

  it("should cache a call with valid block tag if cacheByBlockTag is set", async () => {
    const cachedProvider = ProviderCache.createProxy(provider);
    const encodedInfos = addCalls("5", "6", "7", "8", 1);

    let expectedCacheSize = 0;
    for (const encodedInfo of encodedInfos) {
      expect(await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfo.data }, 1)).toBe(encodedInfo.result);

      expect(ProviderCache["blockDataCache"]!.size).toBe(++expectedCacheSize);
      expect(ProviderCache["blockDataCache"]!.has(cacheKey(TEST_ADDRESS, encodedInfo.data, 1, true))).toBe(true);
    }

    expect(ProviderCache["immutableDataCache"]).toBeUndefined();
  });

  it("should cache a call with valid block tag if cacheByBlockTag is not set", async () => {
    const cachedProvider = ProviderCache.createProxy(provider, false);
    const encodedInfos = addCalls("9", "10", "11", "12", 1);

    let expectedCacheSize = 0;
    for (const encodedInfo of encodedInfos) {
      expect(await cachedProvider.call({ to: TEST_ADDRESS, data: encodedInfo.data }, 1)).toBe(encodedInfo.result);

      expect(ProviderCache["immutableDataCache"]!.size).toBe(++expectedCacheSize);
      expect(ProviderCache["immutableDataCache"]!.has(cacheKey(TEST_ADDRESS, encodedInfo.data, 1, false))).toBe(true);
    }

    expect(ProviderCache["blockDataCache"]).toBeUndefined();
  });

  it("should clear the block data cache on clear() if it is not undefined", async () => {
    const blockCachedProvider = ProviderCache.createProxy(provider, true);

    const { data } = addCalls("13", "14", "15", "16", 1)[0];

    expect(ProviderCache["blockDataCache"]!.size).toBe(0);
    expect(ProviderCache["immutableDataCache"]).toBeUndefined();

    await blockCachedProvider.call({ to: TEST_ADDRESS, data }, 1);

    expect(ProviderCache["blockDataCache"]!.size).toBe(1);
    expect(ProviderCache["immutableDataCache"]).toBeUndefined();

    ProviderCache.clear();

    expect(ProviderCache["blockDataCache"]!.size).toBe(0);
    expect(ProviderCache["immutableDataCache"]).toBeUndefined();
  });

  it("should clear the immutable data cache on clear() if it is not undefined", async () => {
    const immutableCachedProvider = ProviderCache.createProxy(provider, false);

    const { data } = addCalls("13", "14", "15", "16", 1)[0];

    expect(ProviderCache["immutableDataCache"]!.size).toBe(0);
    expect(ProviderCache["blockDataCache"]).toBeUndefined();

    await immutableCachedProvider.call({ to: TEST_ADDRESS, data }, 1);

    expect(ProviderCache["immutableDataCache"]!.size).toBe(1);
    expect(ProviderCache["blockDataCache"]).toBeUndefined();

    ProviderCache.clear();

    expect(ProviderCache["immutableDataCache"]!.size).toBe(0);
    expect(ProviderCache["blockDataCache"]).toBeUndefined();
  });

  it("should clar both caches on clear() if both are not undefined", async () => {
    const blockCachedProvider = ProviderCache.createProxy(provider, true);
    const immutableCachedProvider = ProviderCache.createProxy(provider, false);

    const { data } = addCalls("13", "14", "15", "16", 1)[0];

    expect(ProviderCache["blockDataCache"]!.size).toBe(0);
    expect(ProviderCache["immutableDataCache"]!.size).toBe(0);

    await blockCachedProvider.call({ to: TEST_ADDRESS, data }, 1);

    expect(ProviderCache["blockDataCache"]!.size).toBe(1);
    expect(ProviderCache["immutableDataCache"]!.size).toBe(0);

    await immutableCachedProvider.call({ to: TEST_ADDRESS, data }, 1);

    expect(ProviderCache["blockDataCache"]!.size).toBe(1);
    expect(ProviderCache["immutableDataCache"]!.size).toBe(1);

    ProviderCache.clear();

    expect(ProviderCache["blockDataCache"]!.size).toBe(0);
    expect(ProviderCache["immutableDataCache"]!.size).toBe(0);
  });
});
