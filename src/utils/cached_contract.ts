import { ethers } from "forta-agent";
import { CachedProvider } from "./cached_provider";

export class CachedContract extends ethers.Contract {
  constructor(
    addressOrName: string,
    contractInterface: ethers.ContractInterface,
    signerOrProvider?: ethers.Signer | ethers.providers.Provider,
    cacheByBlockTag: boolean = true
  ) {
    super(
      addressOrName,
      contractInterface,
      signerOrProvider instanceof ethers.providers.Provider
        ? CachedProvider.from(signerOrProvider, cacheByBlockTag)
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
    CachedProvider.clearCache();
  }
}
