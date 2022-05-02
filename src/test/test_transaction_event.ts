import { TransactionEvent, Network, EventType, Transaction, Block, Trace, Log, ethers } from "forta-agent";
import { encodeEventSignature, createAddress } from "../utils";
import { AbiItem } from "web3-utils";

interface TraceProps {
  to?: string;
  from?: string;
  input?: string;
  output?: string;
  value?: string;
}

export class TestTransactionEvent extends TransactionEvent {
  constructor() {
    const transaction: Transaction = {
      hash: "0x",
      from: createAddress("0x0"),
      to: createAddress("0x1"),
      nonce: 0,
      gas: "0",
      gasPrice: "0",
      value: "0",
      data: "0x",
      r: "",
      s: "",
      v: "",
    };

    const block: Block = {} as any;

    super(EventType.BLOCK, Network.MAINNET, transaction, [], {}, block, [], null);
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
    this.transaction.gas = value;
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
    inputs: ReadonlyArray<any> = []
  ): TestTransactionEvent {
    // creating the interface locally allows receiving one less parameter,
    // which makes testing code cleaner
    const iface = new ethers.utils.Interface([event]);

    const log = iface.encodeEventLog(event, inputs);

    this.logs.push({
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
    this.logs.push({
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
    this.logs.push({
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
