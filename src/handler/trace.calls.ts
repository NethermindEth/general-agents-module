import { TransactionEvent, ethers, BlockEvent, Trace } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";

interface Options {
  signature: string;
  from?: string;
  to?: string;
  includeErrors?: boolean;
  filterByArguments?: (args: ethers.utils.Result, index?: number, array?: ethers.utils.Result[]) => boolean;
  filterByOutput?: (output: ethers.utils.Result, index?: number, array?: (ethers.utils.Result | null)[]) => boolean;
  filter?: (call: CallDescription, index?: number, array?: CallDescription[]) => boolean;
}

export type CallDescription = ethers.utils.TransactionDescription & {
  from: string;
  to: string;
  trace: Trace;
  error: boolean;
  output: ethers.utils.Result | null;
};

interface Metadata extends CallDescription {}

export default class TraceCalls extends Handler<Options, Metadata> {
  constructor(options: HandlerOptions<Options, Metadata>) {
    super(options);

    if (this.options.from) this.options.from = this.options.from.toLowerCase();
    if (this.options.to) this.options.to = this.options.to.toLowerCase();
  }

  private filterFunction(txEvent: TransactionEvent): CallDescription[] {
    if (!txEvent.traces || !txEvent.traces.length) {
      return [];
    }

    const traces = txEvent.traces.filter((trace) => {
      if (this.options.from !== undefined && this.options.from !== trace.action.from.toLowerCase()) {
        return false;
      }

      if (this.options.to !== undefined && this.options.to !== trace.action.to.toLowerCase()) {
        return false;
      }

      if (this.options.includeErrors !== undefined && trace.error) {
        return false;
      }

      return true;
    });

    const iface = new ethers.utils.Interface([this.options.signature]);

    const results: CallDescription[] = [];

    for (const trace of traces) {
      let tx;
      try {
        tx = iface.parseTransaction({
          data: trace.action.input,
          value: trace.action.value,
        });
      } catch {
        continue;
      }

      if (!trace.error) {
        results.push({
          ...tx,
          from: trace.action.from?.toLowerCase(),
          to: trace.action.to?.toLowerCase(),
          error: false,
          output: iface.decodeFunctionResult(tx.functionFragment, trace.result.output),
          trace,
        });
      } else {
        results.push({
          ...tx,
          from: trace.action.from?.toLowerCase(),
          to: trace.action.to?.toLowerCase(),
          error: true,
          output: null,
          trace,
        });
      }
    }

    return results;
  }

  public async metadata(event: TransactionEvent | BlockEvent): Promise<Metadata[] | null> {
    if (event instanceof BlockEvent) {
      return null;
    } else {
      const calls = this.filterFunction(event);
      const args = calls.map((call) => call.args);
      const outputs = calls.map((call) => call.output);

      return calls.filter((call, idx) => {
        if (this.options.filterByArguments !== undefined && !this.options.filterByArguments(call.args, idx, args)) {
          return false;
        }

        if (
          this.options.filterByOutput !== undefined &&
          call.output !== null &&
          !this.options.filterByOutput(call.output, idx, outputs)
        ) {
          return false;
        }

        if (this.options.filter !== undefined && !this.options.filter(call, idx, calls)) {
          return false;
        }

        return true;
      });
    }
  }
}
