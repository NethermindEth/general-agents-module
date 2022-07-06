import { Interface } from "@ethersproject/abi";
import { toChecksumAddress } from "ethereumjs-util";
import { when, resetAllWhenMocks } from "jest-when";
import { Log, Filter, FilterByBlockHash } from "@ethersproject/abstract-provider";
import { ethers } from "forta-agent";
import MockEthersSigner from "./mock_ethers_signer";
import { createAddress } from "../utils";

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
    this.call = jest.fn();
    this.getLogs = jest.fn().mockImplementation(this._getLogs.bind(this));
    this.getBlock = jest.fn();
    this.getSigner = jest.fn();
    this.getStorageAt = jest.fn();
    this.getBlockNumber = jest.fn();
    this.getNetwork = jest.fn();

    this.logs = [];
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
      .mockReturnValue(iface.encodeFunctionResult(id, params.outputs));
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

  public addLogs(logs: Log[]): MockEthersProvider {
    this.logs.push(...logs);
    return this;
  }

  private _getLogs(filter: Filter | FilterByBlockHash): Log[] {
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

  /**
   * @deprecated This method was deprecated. Please use {@link MockEthersProvider.addLogs} instead.
   */
  public addFilteredLogs(filter: Filter | FilterByBlockHash, logs: Log[]): MockEthersProvider {
    when(this.getLogs).calledWith(filter).mockReturnValue(logs);
    return this;
  }

  public setNetwork(chainId: number, ensAddress: string = createAddress("0x0"), name: string = "") {
    when(this.getNetwork).calledWith().mockReturnValue({ chainId, ensAddress, name });
  }

  public clear(): void {
    resetAllWhenMocks();

    this.logs = [];
  }
}
