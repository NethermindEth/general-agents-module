import { ethers } from "forta-agent";
import { ProviderCache } from "./provider.cache";

export default class CachedContract extends ethers.Contract {
  constructor(
    addressOrName: string,
    contractInterface: ethers.ContractInterface,
    provider: ethers.providers.Provider,
    cacheByBlockTag: boolean = true
  ) {
    if (!(provider instanceof ethers.providers.BaseProvider)) {
      throw new Error("Unsupported provider");
    }

    super(addressOrName, contractInterface, ProviderCache.createProxy(provider, cacheByBlockTag));
  }

  public static from(contract: ethers.Contract, cacheByBlockTag: boolean = true): ethers.Contract {
    if (contract.signer != null) {
      throw new Error("Creating a CacheContract with a signer is not supported");
    }

    return new CachedContract(contract.address, contract.interface, contract.provider, cacheByBlockTag);
  }

  public static clearCache() {
    ProviderCache.clear();
  }
}
