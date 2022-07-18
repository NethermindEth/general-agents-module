import { Contract } from "@ethersproject/contracts";
import { Abi } from "ethers-multicall/dist/abi";
import { Contract as MulticallContract, ContractCall, Provider } from "ethers-multicall";
import { Provider as EthersProvider } from "@ethersproject/providers";
import { ethers } from "forta-agent";

export const MULTICALL2_ABI = [
  "function tryAggregate(bool, tuple(address target, bytes callData)[] memory) public returns (tuple(bool success, bytes returnData)[] memory)",
];

// Multicall2 contract addresses used by this class.
let multicall2Addresses: Record<number, string> = {
  1: "0x5ba1e12693dc8f9c48aad8770482f4739beed696", // Ethereum Mainnet
  3: "0x5ba1e12693dc8f9c48aad8770482f4739beed696", // Ropsten
  4: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696", // Rinkeby
  5: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696", // Görli
  42: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696", // Kovan
  56: "0x012Cd050ACF174E41872Fd20B696ebaBdA117e9D", // Binance Smart Chain
  97: "0xf08eD5944312c1a0A364e1655D2738765111e61B", // Binance Smart Chain Testnet
  100: "0xFAa296891cA6CECAF2D86eF5F7590316d0A17dA0", // Gnosis
  128: "0xc9A1571bDE3498dd2e5a38f23d2EB1B7a0BbBB61", // Huobi ECO Chain Mainnet
  137: "0x1FE0Fed17D31c9d7e5E46424F17F56A26Bd3f41E", // Polygon Mainnet
  250: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4", // Fantom Opera
  42161: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4", // Arbitrum One
  43114: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4", // Avalanche
  80001: "0x9966772766e676aef1971a32C8f551f44F5cEd1E", // Mumbai
};

const DEFAULT_BATCH_SIZE = 50;

// return types considering T is a tuple

type AllResult<T> = [success: boolean, returns: T];

type TryAllResult<T extends any[]> = {
  [K in keyof T]: K extends number ? { success: boolean; returnData: T[K] } : T[K];
};

type GroupAllResult<T extends any[][]> = [
  success: boolean,
  returns: {
    [K in keyof T]: T[K];
  }
];

type GroupTryAllResult<T extends any[][]> = {
  [K in keyof T]: K extends number ? TryAllResult<T[K]> : T[K];
};

// removes Provider.all() so it can be properly overriden even though the generics don't match
// also turns properties visibility from private into protected so it's easier do use them
declare class _Provider {
  protected _provider: EthersProvider;
  protected _multicallAddress: string;
  constructor(provider: EthersProvider, chainId?: number);
  init(): Promise<void>;
  getEthBalance(address: string): any;
}

/**
 * Provider class heavily based on ethers-multicall, but supporting specifying a blockTag for the multicall contract
 * call and `tryAggregate`.
 */
class MulticallProvider extends (Provider as unknown as new (provider: EthersProvider, chainId?: number) => _Provider) {
  constructor(provider: EthersProvider, chainId?: number) {
    super(provider, chainId);

    if (chainId !== undefined) {
      this.setMulticallAddress(chainId);
    }
  }

  static setMulticall2Addresses(addresses: Record<number, string>) {
    multicall2Addresses = {
      ...multicall2Addresses,
      ...addresses,
    };
  }

  public async init() {
    const { chainId } = await this._provider.getNetwork();

    this.setMulticallAddress(chainId);
  }

  /**
   * Requires success of all calls.
   * @returns Tuple of format [success, results]. `success` indicates whether all the calls were successful or at least
   * one of them failed.
   */
  public async all<T extends any[] = ethers.utils.Result[]>(
    calls: ContractCall[],
    blockTag?: number | string,
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<AllResult<T>> {
    if (!this._provider) {
      throw new Error("Provider should be initialized before use.");
    }
    return await this._all<T>(calls, this._multicallAddress, this._provider, blockTag, batchSize);
  }

  /**
   * Does not require success of calls, returns the success status and result of each call.
   */
  public async tryAll<T extends any[] = ethers.utils.Result[]>(
    calls: ContractCall[],
    blockTag?: number | string,
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<TryAllResult<T>> {
    if (!this._provider) {
      throw new Error("Provider should be initialized before use.");
    }
    return this._tryAll<T>(calls, this._multicallAddress, this._provider, blockTag, batchSize);
  }

  /**
   * Similar to `all` but supports a group of calls as an input. Preserves the inputs calls structure.
   */
  public async groupAll<T extends any[][] = ethers.utils.Result[][]>(
    callGroups: ContractCall[][],
    blockTag?: number | string,
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<GroupAllResult<T>> {
    const flatResults = await this.all<T>(callGroups.flat(), blockTag, batchSize);
    const success = flatResults[0];

    let i = 0;
    const resultsData = callGroups.map((group) => {
      return flatResults[1].slice(i, (i += group.length));
    });

    return [success, success ? resultsData : []] as unknown as GroupAllResult<T>;
  }

  /**
   * Similar to `tryAll` but supports a group of calls as an input. Preserves the inputs calls structure.
   */
  public async groupTryAll<T extends any[][] = ethers.utils.Result[][]>(
    callGroups: ContractCall[][],
    blockTag?: number | string,
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<GroupTryAllResult<T>> {
    const flatResults = await this.tryAll<T>(callGroups.flat(), blockTag, batchSize);

    let i = 0;
    return callGroups.map((group) => {
      return flatResults.slice(i, (i += group.length));
    }) as unknown as GroupTryAllResult<T>;
  }

  private async _tryAll<T extends any[] = ethers.utils.Result[]>(
    calls: ContractCall[],
    multicallAddress: string,
    provider: EthersProvider,
    blockTag?: number | string,
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<TryAllResult<T>> {
    const multicall2 = new Contract(multicallAddress, MULTICALL2_ABI, provider);

    const requests = calls.map((call) => ({
      target: call.contract.address,
      callData: Abi.encode(call.name, call.inputs, call.params),
    }));

    // split requests into batches of size `batchSize`
    const batches = this.batchArray(requests, batchSize);

    const results = (
      await Promise.all(batches.map((batch) => multicall2.callStatic.tryAggregate(false, batch, { blockTag })))
    ).flat() as Array<{ success: boolean; returnData: string }>;

    return results.map((result, idx) => {
      const call = calls[idx];

      if (result.success) {
        const params = Abi.decode(call.outputs, result.returnData);
        return { success: result.success, returnData: call.outputs.length === 1 ? params[0] : params };
      } else {
        return { success: result.success, returnData: [] as any };
      }
    }) as unknown as TryAllResult<T>;
  }

  private async _all<T extends any[] = ethers.utils.Result[]>(
    calls: ContractCall[],
    multicallAddress: string,
    provider: EthersProvider,
    blockTag?: number | string,
    batchSize: number = DEFAULT_BATCH_SIZE
  ): Promise<AllResult<T>> {
    const multicall2 = new Contract(multicallAddress, MULTICALL2_ABI, provider);

    const requests = calls.map((call) => ({
      target: call.contract.address,
      callData: Abi.encode(call.name, call.inputs, call.params),
    }));

    // split requests into batches of size `batchSize`
    const batches = this.batchArray(requests, batchSize);

    try {
      const results = (
        await Promise.all(batches.map((batch) => multicall2.callStatic.tryAggregate(true, batch, { blockTag })))
      ).flat() as Array<{ success: boolean; returnData: string }>;

      const decodedResults = results.map((result, idx) => {
        const call = calls[idx];
        const params = Abi.decode(call.outputs, result.returnData);

        return { success: result.success, returnData: call.outputs.length === 1 ? params[0] : params };
      });

      return [true, decodedResults.map((result) => result.returnData) as T] as AllResult<T>;
    } catch (e) {
      return [false, [] as unknown as T] as AllResult<T>;
    }
  }

  /**
   * Helper function to split the calls array into sub-arrays of size n.
   */
  private batchArray<T>(calls: T[], batchSize: number): T[][] {
    const subArrays = [];

    for (let i = 0; i < calls.length; i += batchSize) {
      subArrays.push(calls.slice(i, i + batchSize));
    }

    return subArrays;
  }

  /**
   * Sets the Multicall2 contract address to a specific chain ID deployed contract.
   * Throws an error if there's no known contract address for that chain ID.
   */
  private setMulticallAddress(chainId: number) {
    if (multicall2Addresses[chainId] === undefined) {
      throw new Error(
        `Unsupported chain ID: ${chainId}. Please set a Multicall2 address for it through MulticallProvider.setMulticall2Addresses()`
      );
    }

    this._multicallAddress = multicall2Addresses[chainId];
  }
}

export { MulticallContract, MulticallProvider };
