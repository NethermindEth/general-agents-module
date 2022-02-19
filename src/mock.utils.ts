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
  public getStorageAt: any;
  public getBlockNumber: any;
  public readonly _isProvider: boolean;

  constructor() { 
    this._isProvider = true;
    this.call = jest.fn(); 
    this.getBlock = jest.fn(); 
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

  public setLatestBlock(block: number) {
    when(this.getBlockNumber)
      .calledWith()
      .mockReturnValue(block);
    return this;
  }

  public clear(): void {
    resetAllWhenMocks();
  }
};
