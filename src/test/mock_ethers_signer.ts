import { Interface } from "@ethersproject/abi";
import { toChecksumAddress } from "ethereumjs-util";
import { when, resetAllWhenMocks } from "jest-when";
import { MockEthersProvider } from ".";

export default class MockEthersSigner {
  public readonly _isSigner: boolean;
  public readonly provider: MockEthersProvider;
  public getAddress: any;
  public sendTransaction: any;

  constructor(provider: MockEthersProvider) {
    this._isSigner = true;
    this.provider = provider;
    this.getAddress = jest.fn();
    this.sendTransaction = jest.fn();
  }

  // Provider functions ------------------------
  // All this calls are redirected to the provider
  public call(txData: any, block: number | string): any {
    return this.provider.call(txData, block);
  }

  public getBlock(num: number): any {
    return this.provider.getBlock(num);
  }

  public getSigner(signer: string): any {
    this.provider.getSigner(signer);
  }

  public getStorageAt(contract: string, slot: number, block: number): any {
    this.provider.getStorageAt(contract, slot, block);
  }

  public getBlockNumber(): any {
    this.provider.getBlockNumber();
  }
  // -------------------------------------------

  public setAddress(addr: string): MockEthersSigner {
    when(this.getAddress).calledWith().mockReturnValue(addr);
    return this;
  }

  public allowTransaction(
    from: string,
    to: string,
    iface: Interface,
    id: string,
    values: any[],
    receipt: any
  ): MockEthersSigner {
    when(this.sendTransaction)
      .calledWith({
        from,
        to: toChecksumAddress(to),
        data: iface.encodeFunctionData(id, values),
      })
      .mockReturnValue({
        async wait() {
          return {
            logs: [], // can't be undefined
            ...receipt,
          };
        },
      });
    return this;
  }

  public denyTransaction(
    from: string,
    to: string,
    iface: Interface,
    id: string,
    values: any[],
    message?: any
  ): MockEthersSigner {
    when(this.sendTransaction)
      .calledWith({
        from,
        to: toChecksumAddress(to),
        data: iface.encodeFunctionData(id, values),
      })
      //@ts-ignore
      .mockRejectedValue(message);
    return this;
  }

  public clear() {
    resetAllWhenMocks();
  }
}
