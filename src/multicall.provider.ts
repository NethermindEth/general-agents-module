import { Contract } from "@ethersproject/contracts";
import { Abi } from "ethers-multicall/dist/abi";
import { Contract as MulticallContract, ContractCall, Provider, setMulticallAddress } from "ethers-multicall";
import { Provider as EthersProvider } from "@ethersproject/providers";

export const MULTICALL2_ABI = [
  "function tryAggregate(bool, tuple(address target, bytes callData)[] memory) public returns (tuple(bool success, bytes returnData)[] memory)",
];

// multiCall2 contract addresses used by this class.
const MULTICALL2_ADDRESSES: Record<number, string> = {
  1: "0x5ba1e12693dc8f9c48aad8770482f4739beed696", // mainnet
  3: "0x5ba1e12693dc8f9c48aad8770482f4739beed696", // Ropsten
  4: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696", // Rinkeby
  5: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696", // Görli
  42: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696", // Kovan
  56: "0x012Cd050ACF174E41872Fd20B696ebaBdA117e9D", // Binance smart chain
  66: "", // OKXChain Mainnet
  97: "0xf08eD5944312c1a0A364e1655D2738765111e61B", // Binance Smart Chain Testnet
  100: "0xFAa296891cA6CECAF2D86eF5F7590316d0A17dA0", // Gnosis
  128: "0xc9A1571bDE3498dd2e5a38f23d2EB1B7a0BbBB61", // Huobi ECO Chain Mainnet
  137: "0x1FE0Fed17D31c9d7e5E46424F17F56A26Bd3f41E", // Polygon Mainnet
  250: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4", // Fantom Opera
  1337: "", //CENNZnet old
  42161: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4", // Arbitrum One
  43114: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4", // Avalanche
  80001: "0x9966772766e676aef1971a32C8f551f44F5cEd1E", // Mumbai
};
// default value used for a batch size.
const DEFAULT_BATCH_SIZE = 50;

// Provider class heavily based on ethers-multicall, but supporting specifying
// a blockTag for the multicall contract call.
class MulticallProvider extends Provider {
  _batchSize: number;

  constructor(
    provider: EthersProvider,
    chainId?: number,
    multicallAddress: Record<number, string> = MULTICALL2_ADDRESSES,
    batchSize: number = DEFAULT_BATCH_SIZE
  ) {
    for (const [network, address] of Object.entries(multicallAddress)) {
      setMulticallAddress(parseInt(network), address);
    }
    super(provider, chainId);
    this._batchSize = batchSize;
  }

  // Requires success of all calls.
  // Return format: [success: bool, results: any[]]. Where `success` indicates if all calls were sucessful.
  public async all<T extends any[] = any[]>(calls: ContractCall[], blockTag?: number | string) {
    // @ts-ignore
    if (!this._provider) {
      throw new Error("Provider should be initialized before use.");
    }

    // @ts-ignore
    return this._all<T>(calls, this._multicallAddress, this._provider, blockTag);
  }

  // Does not require success of calls, returns the success status and result of each call.
  public async tryAll<T extends any[] = any[]>(calls: ContractCall[], blockTag?: number | string) {
    // @ts-ignore
    if (!this._provider) {
      throw new Error("Provider should be initialized before use.");
    }

    // @ts-ignore
    return this._tryAll<T>(calls, this._multicallAddress, this._provider, blockTag);
  }

  // Same as `all` but supports a group of calls as an input. Preserves the inputs calls structure.
  public async groupAll<T extends any[] = any[]>(calls: ContractCall[][], blockTag?: number | string) {
    // @ts-ignore
    if (!this._provider) {
      throw new Error("Provider should be initialized before use.");
    }

    // @ts-ignore
    const res = await this._all<T>(calls.flat(), this._multicallAddress, this._provider, blockTag);
    const success = res[0];
    if (success) {
      const flattenResults = res[1];

      let i = -1;
      const results = calls.map((callsArr) => {
        return callsArr.map(() => {
          i++;
          return flattenResults[i];
        });
      });
      return [success, results] as T;
    } else return [success, []] as T;
  }

  // Same as `tryAll` but supports a group of calls as an input. Preserves the inputs calls structure.
  public async groupTryAll<T extends any[] = any[]>(calls: ContractCall[][], blockTag?: number | string) {
    // @ts-ignore
    if (!this._provider) {
      throw new Error("Provider should be initialized before use.");
    }
    // @ts-ignore

    const flattenResults = await this._tryAll<T>(calls.flat(), this._multicallAddress, this._provider, blockTag);

    let i = -1;
    const results = calls.map((callsArr) => {
      return callsArr.map(() => {
        i++;
        return flattenResults[i];
      });
    });
    return results as T;
  }

  // internal function called by `all`, `groupAll`.
  private async _all<T extends any[] = any[]>(
    calls: ContractCall[],
    multicallAddress: string,
    provider: EthersProvider,
    blockTag?: number | string
  ): Promise<T> {
    const Multicall2 = new Contract(multicallAddress, MULTICALL2_ABI, provider);
    let results = [];
    let success = true;
    // split calls into batches of size `this._batchSize`.
    const subCalls = this.batchArray(calls, this._batchSize);

    try {
      for (let callsBatch of subCalls) {
        const requests = callsBatch.map((call) => ({
          target: call.contract.address,
          callData: Abi.encode(call.name, call.inputs, call.params),
        }));

        const response = await Multicall2.callStatic.tryAggregate(true, requests, { blockTag });

        for (let i = 0; i < callsBatch.length; i++) {
          const outputs = callsBatch[i].outputs;
          const result = response[i];
          const params = Abi.decode(outputs, result.returnData);
          results.push(outputs.length === 1 ? params[0] : params);
        }
      }
    } catch (e) {
      // One or more of the calls failed.
      success = false;
      results = [];
    }

    return [success, results] as T;
  }

  // internal function called by `tryAll`, `groupTryAll`.
  private async _tryAll<T extends any[] = any[]>(
    calls: ContractCall[],
    multicallAddress: string,
    provider: EthersProvider,
    blockTag?: number | string
  ): Promise<T> {
    const Multicall2 = new Contract(multicallAddress, MULTICALL2_ABI, provider);
    const results = [];

    // split calls into batches of size `this._batchSize`.
    const subCalls = this.batchArray(calls, this._batchSize);

    for (let callsBatch of subCalls) {
      const requests = callsBatch.map((call) => ({
        target: call.contract.address,
        callData: Abi.encode(call.name, call.inputs, call.params),
      }));

      const response = await Multicall2.callStatic.tryAggregate(false, requests, { blockTag });

      for (let i = 0; i < callsBatch.length; i++) {
        const outputs = callsBatch[i].outputs;
        const result = response[i];

        if (result.success) {
          const params = Abi.decode(outputs, result.returnData);
          results.push({
            success: result.success,
            returnData: outputs.length === 1 ? params[0] : params,
          });
        } else {
          results.push({
            success: result.success,
            returnData: "0x",
          });
        }
      }
    }

    return results as T;
  }

  // helper function to split the calls array into sub-arrays of size n.
  private batchArray(calls: any[], n: number): any[][] {
    const subArrays = [];

    if (n == 0) return [[]];
    let i;
    for (i = 0; i < calls.length - n; i = i + n) {
      subArrays.push(calls.slice(i, i + n));
    }
    if (i < calls.length) subArrays.push(calls.slice(i));
    return subArrays;
  }
}

export { MulticallContract, MulticallProvider };
