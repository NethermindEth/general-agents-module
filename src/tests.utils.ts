import { leftPad } from "web3-utils";
import {
  TransactionEvent,
  Network,
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  Receipt,
  Transaction,
  Block,
  Trace,
  BlockEvent,
  HandleTransaction,
  HandleBlock,
  Log,
  ethers,
} from "forta-agent";
import { FindingGenerator, encodeEventSignature } from "./utils";
import { AbiItem } from "web3-utils";

export interface Agent {
  handleTransaction: HandleTransaction;
  handleBlock: HandleBlock;
}

export interface TraceProps {
  to?: string;
  from?: string;
  input?: string;
  output?: string;
  value?: string;
}

export const generalTestFindingGenerator: FindingGenerator = (): Finding => {
  return Finding.fromObject({
    name: "Finding Test",
    description: "Finding for test",
    alertId: "TEST",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
  });
};

export const createAddress = (suffix: string): string => {
  return leftPad(suffix, 40);
};

export class TestTransactionEvent extends TransactionEvent {
  constructor() {
    const transaction: Transaction = {
      data: "",
      hash: "",
      from: createAddress("0x0"),
      to: createAddress("0x1"),
      gas: "",
      gasPrice: "",
      value: "0",
    } as any;

    const receipt: Receipt = {
      gasUsed: "1000000",
      logs: [],
      status: true,
    } as any;

    const block: Block = {} as any;

    super(EventType.BLOCK, Network.MAINNET, transaction, receipt, [], {}, block);
  }

  public setHash(hash: string): TestTransactionEvent {
    this.transaction.hash = hash;
    return this;
  }

  public setFrom(address: string): TestTransactionEvent {
    this.transaction.from = address.toLowerCase();
    return this;
  }

  public setTo(address: string): TestTransactionEvent {
    this.transaction.to = address.toLowerCase();
    return this;
  }

  public setValue(value: string): TestTransactionEvent {
    this.transaction.value = value;
    return this;
  }

  public setGas(value: string): TestTransactionEvent {
    this.transaction.gas = value;
    return this;
  }

  public setGasPrice(value: string): TestTransactionEvent {
    this.transaction.gasPrice = value;
    return this;
  }

  public setData(data: string): TestTransactionEvent {
    this.transaction.data = data;
    return this;
  }

  public setGasUsed(value: string): TestTransactionEvent {
    this.receipt.gasUsed = value;
    return this;
  }

  public setStatus(status: boolean): TestTransactionEvent {
    this.receipt.status = status;
    return this;
  }

  public setTimestamp(timestamp: number): TestTransactionEvent {
    this.block.timestamp = timestamp;
    return this;
  }

  public setBlock(block: number): TestTransactionEvent {
    this.block.number = block;
    return this;
  }

  public addInterfaceEventLog(
    event: ethers.utils.EventFragment,
    address: string = createAddress("0x0"),
    inputs: ReadonlyArray<any> = [],
  ): TestTransactionEvent {
    // creating the interface locally allows receiving one less parameter,
    // which makes testing code cleaner
    const iface = new ethers.utils.Interface([event]);

    const log = iface.encodeEventLog(event, inputs);

    this.receipt.logs.push({
      address: address.toLowerCase(),
      topics: log.topics,
      data: log.data,
    } as Log);

    return this;
  }

  public addEventLog(
    eventSignature: string | AbiItem,
    address: string = createAddress("0x0"),
    data: string = "0x",
    ...topics: string[]
  ): TestTransactionEvent {
    this.receipt.logs.push({
      address: address.toLowerCase(),
      topics: [encodeEventSignature(eventSignature), ...topics],
      data,
    } as Log);
    return this;
  }

  public addAnonymousEventLog(
    address: string = createAddress("0x0"),
    data: string = "0x",
    ...topics: string[]
  ): TestTransactionEvent {
    this.receipt.logs.push({
      address: address.toLowerCase(),
      topics,
      data,
    } as Log);
    return this;
  }

  public addInvolvedAddresses(...addresses: string[]): TestTransactionEvent {
    for (let address of addresses) this.addresses[address.toLowerCase()] = true;
    return this;
  }

  public addTraces(...traceProps: TraceProps[]): TestTransactionEvent {
    const toTrace = ({ to, from, input, output, value }: TraceProps) => {
      return {
        action: {
          to: to?.toLowerCase(),
          from: from?.toLowerCase(),
          input,
          value,
        },
        result: { output },
      } as Trace;
    };
    this.traces.push(...traceProps.map(toTrace));
    return this;
  }
}

export class TestBlockEvent extends BlockEvent {
  constructor() {
    const block: Block = {
      transactions: [],
      hash: createAddress("0x0"),
      number: 0,
    } as any;

    super(EventType.BLOCK, Network.MAINNET, block);
  }

  public setNumber(blockNumber: number): TestBlockEvent {
    this.block.number = blockNumber;
    return this;
  }

  public setHash(blockHash: string): TestBlockEvent {
    this.block.hash = blockHash;
    return this;
  }

  public setTimestamp(timestamp: number): TestBlockEvent {
    this.block.timestamp = timestamp;
    return this;
  }

  public addTransactions(...txns: TransactionEvent[]): TestBlockEvent {
    this.block.transactions.push(...txns.map((tx) => tx.hash));
    return this;
  }

  public addTransactionsHashes(...hashes: string[]): TestBlockEvent {
    this.block.transactions.push(...hashes);
    return this;
  }
}

export async function runBlock(agent: Agent, block: BlockEvent, ...txns: TransactionEvent[]): Promise<Finding[]> {
  let findings: Finding[] = [];

  findings.push(...(await agent.handleBlock(block)));
  for (let tx of txns) findings.push(...(await agent.handleTransaction(tx)));

  return findings;
}
