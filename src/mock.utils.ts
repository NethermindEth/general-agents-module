import { Interface } from "@ethersproject/abi";
import { toChecksumAddress } from "ethereumjs-util";
import { when, resetAllWhenMocks } from "jest-when";
import { Log } from "@ethersproject/abstract-provider";

export interface CallParams {
  inputs: any[];
  outputs: any[];
}

export class MockEthersProvider {
  public call: any;
  public getLogs: any;
  public getBlock: any;
  public getSigner: any;
  public getStorageAt: any;
  public getBlockNumber: any;
  public readonly _isProvider: boolean;

  constructor() {
    this._isProvider = true;
    this.call = jest.fn();
    this.getLogs = jest.fn();
    this.getBlock = jest.fn();
    this.getSigner = jest.fn();
    this.getStorageAt = jest.fn();
    this.getBlockNumber = jest.fn();
  }

  public addCallTo(
    contract: string,
    block: number | string,
    iface: Interface,
    id: any,
    params: CallParams, 
  ): MockEthersProvider {
    when(this.call)
      .calledWith(
        {
          data: iface.encodeFunctionData(id, params.inputs),
          to: toChecksumAddress(contract),
        },
        block
      )
      .mockReturnValue(iface.encodeFunctionResult(id, params.outputs));
    return this;
  }

  public addCallFrom(
    contract: string,
    from: string, 
    block: number | string,
    iface: Interface,
    id: any,
    params: CallParams, 
  ): MockEthersProvider {
    when(this.call)
      .calledWith(
        {
          data: iface.encodeFunctionData(id, params.inputs),
          to: toChecksumAddress(contract),
          from,
        },
        block,
      )
      .mockReturnValue(iface.encodeFunctionResult(id, params.outputs));
    return this;
  }

  public addStorage(contract: string, slot: number, block: number, result: string): MockEthersProvider {
    when(this.getStorageAt).calledWith(contract, slot, block).mockReturnValue(result);
    return this;
  }

  public addBlock(blockNumber: number, block: any): MockEthersProvider {
    when(this.getBlock).calledWith(blockNumber).mockReturnValue(block);
    return this;
  }

  public setLatestBlock(block: number): MockEthersProvider {
    when(this.getBlockNumber).calledWith().mockReturnValue(block);
    return this;
  }

  public addSigner(addr: string): MockEthersProvider {
    when(this.getSigner).calledWith(addr).mockReturnValue(new MockEthersSigner(this).setAddress(addr));
    return this;
  }

  public addFilteredLogs(filter: any, logs: Log[]): MockEthersProvider {
    when(this.getLogs).calledWith(filter).mockReturnValue(logs);
    return this;
  }

  public clear(): void {
    resetAllWhenMocks();
  }
}

export class MockEthersSigner {
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
  };

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
