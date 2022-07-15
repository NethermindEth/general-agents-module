import { TransactionEvent, ethers, BlockEvent } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";

interface Options {
  from?: string;
  to?: string;
  valueThreshold?: ethers.BigNumberish | ((amount: ethers.BigNumber) => boolean);
}

interface Metadata {
  from: string;
  to: string;
  value: ethers.BigNumber;
}

export default class EthTransfers extends Handler<Options, Metadata> {
  isLarge: (value: ethers.BigNumber) => boolean = () => true;

  constructor(options: HandlerOptions<Options, Metadata>) {
    super(options);

    if (this.options.from) this.options.from = this.options.from.toLowerCase();
    if (this.options.to) this.options.to = this.options.to.toLowerCase();
    if (this.options.valueThreshold) {
      if (typeof this.options.valueThreshold === "function") {
        this.isLarge = this.options.valueThreshold;
      } else {
        const bnThreshold = ethers.BigNumber.from(this.options.valueThreshold);
        this.isLarge = (value) => value.gte(bnThreshold);
      }
    }
  }

  public async metadata(event: TransactionEvent | BlockEvent): Promise<Metadata[] | null> {
    if (event instanceof BlockEvent) {
      return null;
    } else {
      const data: Metadata[] = [];

      event.traces.forEach((trace) => {
        if (trace.action.from !== this.options.from) return;
        if (trace.action.to !== this.options.to) return;

        const bnValue = ethers.BigNumber.from(trace.action.value);
        if (!this.isLarge(bnValue)) return;

        data.push({
          from: trace.action.from,
          to: trace.action.to,
          value: bnValue,
        });
      });

      return data;
    }
  }
}
