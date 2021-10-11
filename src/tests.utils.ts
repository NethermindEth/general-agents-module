import Web3 from "web3";
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
} from "forta-agent";
import { FindingGenerator } from "./utils";
import { keccak256 } from "forta-agent/dist/sdk/utils";

interface Agent {
  handleTransaction: HandleTransaction,
  handleBlock: HandleBlock,
};

interface TraceProps {
  to?: string;
  from?: string;
  input?: string;
  output?: string;
};

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
  return Web3.utils.leftPad(suffix, 40);
};

export class TestTransactionEvent extends TransactionEvent {
  constructor() {
    const transaction: Transaction = {
      data: "",
      hash: "",
      from: createAddress("0x0"),
      to: createAddress("0x1"),
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
    this.transaction.from = address;
    return this;
  }

  public setTo(address: string): TestTransactionEvent {
    this.transaction.to = address;
    return this;
  }

  public setValue(value: string): TestTransactionEvent {
    this.transaction.value = value;
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

  public addEventLog(
    eventSignature: string,
    address: string = createAddress("0x0"),
    topics: string[] = [],
    data: string = ""
  ): TestTransactionEvent {
    this.receipt.logs.push({
      address,
      topics: [keccak256(eventSignature), ...topics],
      data,
    } as any);
    return this;
  }

  public addInvolvedAddress(address: string): TestTransactionEvent {
    this.addresses[address] = true;
    return this;
  }

  public addTrace({ to, from, input, output }: TraceProps): TestTransactionEvent {
    const trace: Trace = {
      action: {
        to,
        from,
        input,
      },
      result: {
        output
      },
    } as any;
    this.traces.push(trace);
    return this;
  }
};

export class TestBlockEvent extends BlockEvent {
  constructor(blockNumber: number = 0, blockHash: string = createAddress("0x0")) {
    const block: Block = {
      transactions: [],
      hash: blockHash,
      number: blockNumber,
    } as any;

    super(EventType.BLOCK, Network.MAINNET, blockHash, blockNumber, block);
  }

  public setNumber(blockNumber: number): TestBlockEvent{
    this.block.number = blockNumber;
    return this;
  }

  public setHash(blockHash: string): TestBlockEvent{
    this.block.hash = blockHash;
    return this;
  }

  public addTransactions(...txns: TestTransactionEvent[]): TestBlockEvent {
    this.block.transactions.push(
      ...txns.map(tx => tx.hash)
    )
    return this;
  }

  public addTransactionsHashes(...hashes: string[]): TestBlockEvent {
    this.block.transactions.push(...hashes);
    return this;
  }
};

export async function runBlock(
  agent: Agent, 
  block: TestBlockEvent,
  ...txns: TestTransactionEvent[]
): Promise<Finding[]> {
  let findings: Finding[] = [];

  findings.push(...await agent.handleBlock(block));
  for(let tx of txns)
    findings.push(...await agent.handleTransaction(tx));

  return findings;
};
