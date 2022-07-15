import { ethers } from "forta-agent";
import { ProviderCache } from "./provider.cache";

export default class CachedContract extends ethers.Contract {
  constructor(
    addressOrName: string,
    contractInterface: ethers.ContractInterface,
    signerOrProvider?: ethers.Signer | ethers.providers.BaseProvider,
    cacheByBlockTag: boolean = true
  ) {
    super(
      addressOrName,
      contractInterface,
      signerOrProvider instanceof ethers.providers.BaseProvider
        ? ProviderCache.createProxy(signerOrProvider, cacheByBlockTag)
        : signerOrProvider
    );
  }

  public static from(contract: ethers.Contract, cacheByBlockTag: boolean = true): ethers.Contract {
    return new CachedContract(
      contract.address,
      contract.interface,
      contract.signer || contract.provider,
      cacheByBlockTag
    );
  }

  public static clearCache() {
    ProviderCache.clear();
  }
}
