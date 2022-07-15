import { TransactionEvent, ethers, BlockEvent } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";

namespace EthTransfers {
  export interface Options {
    from?: string;
    to?: string;
    valueThreshold?: ethers.BigNumberish | ((amount: ethers.BigNumber) => boolean);
  }

  export interface Metadata {
    from: string;
    to: string;
    value: ethers.BigNumber;
  }
}

class EthTransfers extends Handler<EthTransfers.Options, EthTransfers.Metadata> {
  isLarge: (value: ethers.BigNumber) => boolean = () => true;

  constructor(options: HandlerOptions<EthTransfers.Options, EthTransfers.Metadata>) {
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

  public async metadata(event: TransactionEvent | BlockEvent): Promise<EthTransfers.Metadata[] | null> {
    if (event instanceof BlockEvent) {
      return null;
    } else {
      const data: EthTransfers.Metadata[] = [];

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

export default EthTransfers;
