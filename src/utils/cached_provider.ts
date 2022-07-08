import { ethers } from "forta-agent";
import { Mutex } from "async-mutex";
import LRU from "lru-cache";
import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable, resolveProperties } from "@ethersproject/properties";
import { Transaction } from "@ethersproject/transactions";

export interface CachedProviderOptions {
  blockDataCacheSize: number;
  immutableDataCacheSize: number;
}

export class CachedProvider {
  private static blockDataCache?: LRU<string, Promise<Buffer>>;
  private static immutableDataCache?: LRU<string, Promise<Buffer>>;

  private static blockDataCacheMutex = new Mutex();
  private static immutableDataCacheMutex = new Mutex();

  private static options: CachedProviderOptions = {
    blockDataCacheSize: 200,
    immutableDataCacheSize: 100,
  };

  public static from<T extends ethers.providers.BaseProvider>(provider: T, cacheByBlockTag: boolean = true): T {
    if (this.blockDataCache === undefined) {
      this.blockDataCache = new LRU<string, Promise<Buffer>>({ max: this.options.blockDataCacheSize });
    }

    if (this.immutableDataCache === undefined && !cacheByBlockTag) {
      this.immutableDataCache = new LRU<string, Promise<Buffer>>({ max: this.options.immutableDataCacheSize });
    }

    return new Proxy(provider, {
      get(target: T, prop: string | symbol) {
        if (prop === "call") {
          const cb: typeof provider.call = (
            transaction: Deferrable<TransactionRequest>,
            blockTag?: BlockTag | Promise<BlockTag>
          ) => {
            return CachedProvider.call(target, transaction, blockTag, cacheByBlockTag);
          };

          return cb;
        } else {
          return target[prop as keyof T];
        }
      },
    });
  }

  private static async isTransactionCacheable(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag | Promise<BlockTag>
  ): Promise<boolean> {
    blockTag = await blockTag;

    if (blockTag === "latest" || blockTag == null) {
      return false;
    }

    if (typeof blockTag === "number" && !Number.isInteger(blockTag)) {
      return false;
    }

    if ((await transaction.to) == null) {
      return false;
    }

    return true;
  }

  private static async cacheKey(transaction: Transaction, blockTag: string, cacheByBlockTag: boolean): Promise<string> {
    const data = transaction.data.slice(2);
    const to = transaction.to ? transaction.to.slice(2) : "";
    const block = cacheByBlockTag ? blockTag.slice(2) : "";

    const isOddLength = (data.length + to.length + block.length) & 1;

    return Buffer.from(`${to}${isOddLength ? "0" : ""}${block}${data}`, "hex").toString("base64");
  }

  private static outputToBuffer(output: string): Buffer {
    return Buffer.from(output.slice(2), "hex");
  }

  private static bufferToOutput(buffer: Buffer): string {
    return `0x${buffer.toString("hex")}`;
  }

  private static async call(
    provider: ethers.providers.BaseProvider,
    transaction: Deferrable<TransactionRequest>,
    blockTag: BlockTag | Promise<BlockTag> | undefined,
    cacheByBlockTag: boolean
  ): Promise<string> {
    provider;
    if (!(await this.isTransactionCacheable(transaction, blockTag))) {
      return await provider.call(transaction, blockTag);
    }

    // similar to https://github.com/ethers-io/ethers.js/blob/608864fc3f00390e1260048a157af00378a98e41/packages/providers/src.ts/base-provider.ts#L1718
    const resolved = await resolveProperties({
      transaction: provider._getTransactionRequest(transaction),
      blockTag: provider._getBlockTag(blockTag!),
    });

    const key = await this.cacheKey(resolved.transaction, resolved.blockTag as string, cacheByBlockTag);

    // two different caches so information that shouldn't change between blocks is more efficiently handled
    const [cache, mutex] = cacheByBlockTag
      ? [this.blockDataCache!, this.blockDataCacheMutex]
      : [this.immutableDataCache!, this.immutableDataCacheMutex];

    let promise: Promise<Buffer>;

    const release = await mutex.acquire();
    try {
      if (cache.has(key)) {
        promise = cache.get(key)!;
      } else {
        promise = provider.call(transaction, blockTag).then((output) => this.outputToBuffer(output));
        cache.set(key, promise);
      }
    } finally {
      release();
    }

    return promise.then((buffer) => this.bufferToOutput(buffer));
  }

  private static updateBlockDataCache() {
    if (this.blockDataCache !== undefined) {
      this.blockDataCache = new LRU<string, Promise<Buffer>>({ max: this.options.blockDataCacheSize });
    }
  }

  private static updateImmutableDataCache() {
    if (this.immutableDataCache !== undefined) {
      this.immutableDataCache = new LRU<string, Promise<Buffer>>({ max: this.options.immutableDataCacheSize });
    }
  }

  public static clearCache() {
    this.blockDataCache?.clear();
    this.immutableDataCache?.clear();
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
