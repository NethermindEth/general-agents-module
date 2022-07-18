import { ethers } from "forta-agent";

export default class NetworkManager<T extends Record<any, any>> {
  private chainId: number = -1;

  constructor(private networkMap: Record<number, T>, chainId?: number) {
    if (chainId !== undefined) {
      this.setNetwork(chainId);
    }
  }

  public getNetworkMap(): Readonly<Record<number, T>> {
    return this.networkMap;
  }

  public getNetwork() {
    return this.chainId;
  }

  public setNetwork(chainId: number) {
    if (!this.networkMap[chainId]) {
      throw new Error(`The network with ID ${chainId} is not supported`);
    }

    this.chainId = chainId;
  }

  public async init(provider: ethers.providers.Provider) {
    const { chainId } = await provider.getNetwork();

    this.setNetwork(chainId);
  }

  public get<K extends keyof T>(key: K): T[K] {
    if (this.chainId === -1) throw new Error("NetworkManager was not initialized");

    return this.networkMap[this.chainId][key];
  }
}
