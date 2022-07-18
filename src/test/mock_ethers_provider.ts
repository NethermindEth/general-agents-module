import { Interface } from "@ethersproject/abi";
import { when, resetAllWhenMocks } from "jest-when";
import { Log, Filter, FilterByBlockHash } from "@ethersproject/abstract-provider";
import { ethers } from "forta-agent";
import MockEthersSigner from "./mock_ethers_signer";
import { createAddress, toChecksumAddress } from "../utils";

interface CallParams {
  inputs: any[];
  outputs: any[];
}

export default class MockEthersProvider {
  public call: any;
  public getLogs: any;
  public getBlock: any;
  public getSigner: any;
  public getStorageAt: any;
  public getBlockNumber: any;
  public getNetwork: any;
  public readonly _isProvider: boolean;

  private logs: Array<ethers.providers.Log>;

  constructor() {
    this._isProvider = true;
    this.call = jest.fn().mockImplementation(this.unconfiguredAsyncMockImplementation("call"));
    this.getLogs = jest.fn().mockImplementation(this._getLogs.bind(this));
    this.getBlock = jest.fn().mockImplementation(this.unconfiguredAsyncMockImplementation("getBlock"));
    this.getSigner = jest.fn().mockImplementation(this.unconfiguredAsyncMockImplementation("getSigner"));
    this.getStorageAt = jest.fn().mockImplementation(this.unconfiguredAsyncMockImplementation("getStorageAt"));
    this.getBlockNumber = jest.fn().mockImplementation(this.unconfiguredAsyncMockImplementation("getBlockNumber"));
    this.getNetwork = jest.fn().mockImplementation(this.unconfiguredAsyncMockImplementation("getNetwork"));

    this.logs = [];
  }

  private unconfiguredAsyncMockImplementation(method: string): () => Promise<never> {
    return async () => {
      throw new Error(`${method} was not configured for this input`);
    };
  }

  public addCallTo(
    contract: string,
    block: number | string,
    iface: Interface,
    id: any,
    params: CallParams
  ): MockEthersProvider {
    when(this.call)
      .calledWith(
        {
          data: iface.encodeFunctionData(id, params.inputs),
          to: toChecksumAddress(contract),
        },
        block
      )
      .mockReturnValue(Promise.resolve(iface.encodeFunctionResult(id, params.outputs)));
    return this;
  }

  public addCallFrom(
    contract: string,
    from: string,
    block: number | string,
    iface: Interface,
    id: any,
    params: CallParams
  ): MockEthersProvider {
    when(this.call)
      .calledWith(
        {
          data: iface.encodeFunctionData(id, params.inputs),
          to: toChecksumAddress(contract),
          from,
        },
        block
      )
      .mockReturnValue(Promise.resolve(iface.encodeFunctionResult(id, params.outputs)));
    return this;
  }

  public addStorage(contract: string, slot: number, block: number, result: string): MockEthersProvider {
    when(this.getStorageAt).calledWith(contract, slot, block).mockReturnValue(Promise.resolve(result));
    return this;
  }

  public addBlock(blockNumber: number, block: any): MockEthersProvider {
    when(this.getBlock).calledWith(blockNumber).mockReturnValue(Promise.resolve(block));
    return this;
  }

  public setLatestBlock(block: number): MockEthersProvider {
    when(this.getBlockNumber).calledWith().mockReturnValue(Promise.resolve(block));
    return this;
  }

  public addSigner(addr: string): MockEthersProvider {
    when(this.getSigner).calledWith(addr).mockReturnValue(new MockEthersSigner(this).setAddress(addr));
    return this;
  }

  public addLogs(logs: Log[]): MockEthersProvider {
    this.logs.push(...logs);
    return this;
  }

  private async _getLogs(filter: Filter | FilterByBlockHash): Promise<Log[]> {
    let logs = this.logs;

    if (filter.address) {
      logs = logs.filter((log) => log.address.toLowerCase() === filter.address!.toLowerCase());
    }

    if (filter.topics) {
      const filterTopics = filter.topics!;

      logs = logs.filter((log) => {
        if (filterTopics.length > log.topics.length) {
          return false;
        }

        for (let i = 0; i < filterTopics.length; i++) {
          const logTopic = log.topics[i];
          const filterTopic = filterTopics[i];

          if (filterTopic === null) continue;
          if (!logTopic) return false;

          if (Array.isArray(filterTopic)) {
            if (!filterTopic.includes(logTopic)) {
              return false;
            }
          } else if (logTopic !== filterTopic) {
            return false;
          }
        }

        return true;
      });
    }

    if ("fromBlock" in filter && filter.fromBlock !== undefined) {
      logs = logs.filter((log) => log.blockNumber >= filter.fromBlock!);
    }

    if ("toBlock" in filter && filter.toBlock !== undefined) {
      logs = logs.filter((log) => log.blockNumber <= filter.toBlock!);
    }

    if ("blockHash" in filter && filter.blockHash !== undefined) {
      logs = logs.filter((log) => log.blockHash <= filter.blockHash!);
    }

    return logs;
  }

  public setNetwork(chainId: number, ensAddress: string = createAddress("0x0"), name: string = "") {
    when(this.getNetwork).calledWith().mockReturnValue({ chainId, ensAddress, name });
  }

  public clear(): void {
    resetAllWhenMocks();

    this.logs = [];
  }
}
