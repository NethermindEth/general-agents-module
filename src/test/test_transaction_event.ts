import { TransactionEvent, Network, EventType, Transaction, Block, Trace, Log, ethers } from "forta-agent";
import { createAddress } from "../utils";

interface TraceProps {
  function?: ethers.utils.FunctionFragment | string;
  to?: string;
  from?: string;
  arguments?: any[];
  output?: any[];
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

  public addEventLog(
    event: ethers.utils.EventFragment | string,
    address: string = createAddress("0x0"),
    inputs: ReadonlyArray<any> = []
  ): TestTransactionEvent {
    const iface = new ethers.utils.Interface([event]);
    const eventFragment = ethers.utils.EventFragment.from(ethers.utils.Fragment.from(event));

    const log = iface.encodeEventLog(eventFragment, inputs);

    this.logs.push({
      address: address.toLowerCase(),
      topics: log.topics,
      data: log.data,
    } as Log);

    return this;
  }

  public addInvolvedAddresses(...addresses: string[]): TestTransactionEvent {
    for (let address of addresses) this.addresses[address.toLowerCase()] = true;
    return this;
  }

  public addTraces(...traceProps: TraceProps[]): TestTransactionEvent {
    const toTrace = (props: TraceProps) => {
      if (!props.function) {
        return {
          action: {
            to: props.to?.toLowerCase(),
            from: props.from?.toLowerCase(),
            value: props.value,
          },
        } as Trace;
      }

      const functionFragment = ethers.utils.FunctionFragment.from(ethers.utils.Fragment.from(props.function));
      const iface = new ethers.utils.Interface([functionFragment]);
      return {
        action: {
          to: props.to?.toLowerCase(),
          from: props.from?.toLowerCase(),
          input: iface.encodeFunctionData(functionFragment, props.arguments),
          value: props.value,
        },
        result: {
          output: iface.encodeFunctionResult(functionFragment, props.output),
        },
      } as Trace;
    };

    this.traces.push(...traceProps.map(toTrace));

    return this;
  }
}
