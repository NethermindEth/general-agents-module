import { Interface } from "@ethersproject/abi";
import { toChecksumAddress } from 'ethereumjs-util';
import { when, resetAllWhenMocks } from "jest-when";

export interface CallParams {
  inputs: any[],
  outputs: any[],
}

export class MockEthersProvider {
  public call: any;
  public getBlock: any;
  public getSigner: any;
  public getStorageAt: any;
  public getBlockNumber: any;
  public readonly _isProvider: boolean;

  constructor() { 
    this._isProvider = true;
    this.call = jest.fn(); 
    this.getBlock = jest.fn(); 
    this.getSigner = jest.fn(); 
    this.getStorageAt = jest.fn(); 
    this.getBlockNumber = jest.fn(); 
  }

  public addCallTo(contract: string, block: number | string, iface: Interface, id: any, params: CallParams): MockEthersProvider {
    when(this.call)
      .calledWith({
        data: iface.encodeFunctionData(id, params.inputs),
        to: toChecksumAddress(contract),
      }, block)
      .mockReturnValue(iface.encodeFunctionResult(id, params.outputs));
    return this;
  }

  public addStorage(contract: string, slot: number, block: number, result: string): MockEthersProvider {
    when(this.getStorageAt)
      .calledWith(contract, slot, block)
      .mockReturnValue(result);
    return this;
  }

  public addBlock(blockNumber: number, block: any): MockEthersProvider {
    when(this.getBlock)
      .calledWith(blockNumber)
      .mockReturnValue(block);
    return this;
  }

  public setLatestBlock(block: number): MockEthersProvider {
    when(this.getBlockNumber)
      .calledWith()
      .mockReturnValue(block);
    return this;
  }

  public addSigner(addr: string): MockEthersProvider {
    when(this.getSigner)
      .calledWith(addr)
      .mockReturnValue(
        new MockEthersSigner()
          .bindProvider(this)
          .setAddress(addr)
      );
    return this;
  }

  public clear(): void {
    resetAllWhenMocks();
  }
};

export class MockEthersSigner extends MockEthersProvider {
  public readonly _isSigner: boolean;
  public getAddress: any;
  public sendTransaction: any;

  constructor() {
    super();
    this._isSigner = true;
    this.getAddress = jest.fn();
    this.sendTransaction = jest.fn();
  }  

  public bindProvider(provider: MockEthersProvider): MockEthersSigner {
    this.call = provider.call;
    this.getBlock = provider.getBlock;
    this.getStorageAt = provider.getStorageAt;
    this.getBlockNumber = provider.getBlockNumber;
    return this;
  }

  public setAddress(addr: string): MockEthersSigner {
    when(this.getAddress)
      .calledWith()
      .mockReturnValue(addr);
    return this;
  }

  public allowTransaction(
    from: string,
    to: string,
    iface: Interface,
    id: string,
    values: any[],
    receipt: any, 
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
        }
      });
    return this;
  }

  public denyTransaction(
    from: string,
    to: string,
    iface: Interface,
    id: string,
    values: any[],
    message?: any,
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
}
