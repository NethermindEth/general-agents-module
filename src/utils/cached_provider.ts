import { ethers } from "forta-agent";
import { Mutex } from "async-mutex";
import LRU from "lru-cache";
import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";

export interface CachedProviderOptions {
  blockDataCacheSize: number;
  immutableDataCacheSize: number;
}

export class CachedProvider {
  private static blockDataCache: LRU<string, Promise<string>>;
  private static immutableDataCache: LRU<string, Promise<string>>;
  
  private static blockDataCacheMutex = new Mutex();
  private static immutableDataCacheMutex = new Mutex();

  private static options: CachedProviderOptions = {
    blockDataCacheSize: 200,
    immutableDataCacheSize: 100,
  };

  public static from(provider: ethers.providers.Provider, cacheByBlockTag: boolean = true): ethers.providers.Provider {
    if (this.blockDataCache === undefined) {
      this.blockDataCache = new LRU<string, Promise<string>>({ max: this.options.blockDataCacheSize });
    }

    if (this.immutableDataCache === undefined && !cacheByBlockTag) {
      this.immutableDataCache = new LRU<string, Promise<string>>({ max: this.options.immutableDataCacheSize });
    }

    return new Proxy(provider, {
      get(target: ethers.providers.Provider, prop: keyof ethers.providers.Provider) {
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

    // two different caches so information that shouldn't change between blocks is more efficiently handled
    const [cache, mutex] = (cacheByBlockTag)
      ? [this.blockDataCache, this.blockDataCacheMutex]
      : [this.immutableDataCache, this.immutableDataCacheMutex];

    let promise: Promise<string>;

    const release = await mutex.acquire();
    try {
      if (cache.has(key)) {
        promise = cache.get(key)!;
      } else {
        promise = provider.call(transaction, blockTag);
        cache.set(key, promise);
      }
    } finally {
      release();
    }

    return promise;
  }

  private static updateBlockDataCache() {
    if (this.blockDataCache !== undefined) {
      this.blockDataCache = new LRU<string, Promise<string>>({ max: this.options.blockDataCacheSize });
    }
  }

  private static updateImmutableDataCache() {
    if (this.immutableDataCache !== undefined) {
      this.immutableDataCache = new LRU<string, Promise<string>>({ max: this.options.immutableDataCacheSize });
    }
  }

  public static clearCache() {
    this.blockDataCache.clear();
    this.immutableDataCache.clear();
  }

  public static set(options: Partial<CachedProviderOptions>) {
    this.options = {
      ...this.options,
      ...options,
    };

    if (options.blockDataCacheSize !== undefined) {
      this.updateBlockDataCache();
    }

    if (options.immutableDataCacheSize !== undefined) {
      this.updateImmutableDataCache();
    }
  }
}
