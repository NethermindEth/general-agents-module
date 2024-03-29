import { providers, ethers } from "ethers";
import { EVM } from "evm";
import LRU from "lru-cache";
import { TransactionEvent } from "forta-agent";

const CONTRACT_SLOT_ANALYSIS_DEPTH = 10;

export default class AddressesExtractor {
  provider: providers.Provider;
  private isContractCache: LRU<string, boolean>;

  constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
    this.isContractCache = new LRU<string, boolean>({ max: 10000 });
  }

  private isContract = async (address: string, blockNumber: number) => {
    let isContract = this.isContractCache.get(address);
    if (isContract === undefined) {
      const code = await this.provider.getCode(address, blockNumber);
      if (code && code !== "0x") {
        this.isContractCache.set(address, true);
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  };

  private getStorageAddresses = async (address: string, blockNumber: number) => {
    const addressSet = new Set<string>();

    for (let i = 0; i < CONTRACT_SLOT_ANALYSIS_DEPTH; i++) {
      const mem: string = await this.provider.getStorageAt(ethers.utils.getAddress(address), i, blockNumber);
      if (mem != "0x0000000000000000000000000000000000000000000000000000000000000000") {
        if (await this.isContract(mem.substring(0, 42), blockNumber)) {
          addressSet.add(ethers.utils.getAddress(mem.substring(0, 42)));
        }
        if (await this.isContract("0x" + mem.substring(26), blockNumber)) {
          addressSet.add(ethers.utils.getAddress("0x" + mem.substring(26)));
        }
      }
    }
    return addressSet;
  };

  private getOpcodeAddresses = async (address: string, blockNumber: number, _evm: typeof EVM) => {
    const addressSet = new Set<string>();

    const code = await this.provider.getCode(address, blockNumber);
    const evm = new _evm(code);
    const opcode = evm.getOpcodes();

    await Promise.all(
      opcode.map(async (op) => {
        if (op.pushData) {
          const param = op.pushData.toString("hex");
          if (param.length === 40) {
            if (await this.isContract("0x" + param, blockNumber)) {
              addressSet.add(ethers.utils.getAddress("0x" + param));
            }
          } else if (param.length === 64) {
            if (await this.isContract("0x" + param.substring(24), blockNumber)) {
              addressSet.add(ethers.utils.getAddress("0x" + param.substring(24)));
            }
          }
        }
      })
    );
    return addressSet;
  };

  public extractAddresses = async (txEvent: TransactionEvent): Promise<Set<string>> => {
    let extractedAddresses: string[] = [];
    let createdContractAddresses: string[] = [];
    const { traces, blockNumber } = txEvent;

    if (traces.length > 0) {
      await Promise.all(
        traces.map(async (trace) => {
          if (trace.type === "create") {
            if (txEvent.from === trace.action.from || createdContractAddresses.includes(trace.action.from)) {
              const createdContractAddress = trace.result.address;
              createdContractAddresses.push(createdContractAddress);
              const storageAddresses = await this.getStorageAddresses(createdContractAddress, blockNumber);
              const opcodeAddresses = await this.getOpcodeAddresses(createdContractAddress, blockNumber, EVM);
              extractedAddresses.push(...Array.from(storageAddresses), ...Array.from(opcodeAddresses));
            }
          }
        })
      );
    } else {
      if (!txEvent.to) {
        const nonce = txEvent.transaction.nonce;
        const createdContractAddress = ethers.utils.getContractAddress({ from: txEvent.from, nonce: nonce });
        createdContractAddresses.push(createdContractAddress);
        const storageAddresses = await this.getStorageAddresses(createdContractAddress, blockNumber);
        const opcodeAddresses = await this.getOpcodeAddresses(createdContractAddress, blockNumber, EVM);
        extractedAddresses.push(...Array.from(storageAddresses), ...Array.from(opcodeAddresses));
      }
    }
    const extractedAddressesSet: Set<string> = new Set(extractedAddresses);
    return extractedAddressesSet;
  };
}
