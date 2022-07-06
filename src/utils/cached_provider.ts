import { ethers } from "forta-agent";
import { Mutex } from "async-mutex";
import LRU from "lru-cache";
import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";

export class CachedProvider {
  private static cache = new LRU<string, Promise<string>>({ max: 1000 });
  private static mutex = new Mutex();

  public static from(provider: ethers.providers.Provider, cacheByBlockTag: boolean = true): ethers.providers.Provider {
    return new Proxy(provider, {
      get(target: ethers.providers.Provider, prop: keyof ethers.providers.Provider) {
        if (!(prop in target)) throw new Error(`Unknown provider property: ${prop}`);

        if (prop === "call") {
          return (transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>) => {
            return CachedProvider.call(target, transaction, blockTag, cacheByBlockTag);
          };
        } else {
          return target[prop];
        }
      },
    });
  }

  private static async normalizeBlockTag(blockTag?: BlockTag | Promise<BlockTag>): Promise<BlockTag | null> {
    blockTag = await blockTag;

    if (blockTag === "latest" || blockTag == null) {
      return null;
    }

    if (typeof blockTag === "number" && (!Number.isInteger(blockTag) || blockTag < 0)) {
      return null;
    }

    return blockTag;
  }

  private static cacheKey(
    transaction: Deferrable<TransactionRequest>,
    blockTag: BlockTag,
    cacheByBlockTag: boolean
  ): string {
    return `${transaction.to}|${transaction.data}|${cacheByBlockTag ? blockTag : ""}`;
  }

  private static async call(
    provider: ethers.providers.Provider,
    transaction: Deferrable<TransactionRequest>,
    blockTag: BlockTag | Promise<BlockTag> | undefined,
    cacheByBlockTag: boolean
  ): Promise<string> {
    const normalizedBlockTag = await CachedProvider.normalizeBlockTag(blockTag);

    if (normalizedBlockTag === null) {
      return await provider.call(transaction, blockTag);
    }

    const key = this.cacheKey(transaction, normalizedBlockTag, cacheByBlockTag);

    let promise: Promise<string>;

    const release = await this.mutex.acquire();
    try {
      if (this.cache.has(key)) {
        promise = this.cache.get(key)!;
      } else {
        promise = provider.call(transaction, blockTag);
        CachedProvider.cache.set(key, promise);
      }
    } finally {
      release();
    }

    return promise;
  }

  public static clearCache() {
    this.cache.clear();
  }
}
