import { ethers } from "forta-agent";
import { CachedProvider } from "./cached_provider";

export class CachedContract {
  public static from(contract: ethers.Contract, cacheByBlockTag: boolean = true) {
    return new ethers.Contract(
      contract.address,
      contract.interface,
      CachedProvider.from(contract.provider, cacheByBlockTag)
    );
  }

  public static clearCache() {
    CachedProvider.clearCache();
  }
}
