import { LogDescription, TransactionEvent, ethers, BlockEvent } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";

const EVENT_SIGNATURE = "event Transfer(address indexed from, address indexed to, uint256 amount)";

namespace Erc20Transfers {
  export interface Options {
    emitter?: string;
    from?: string;
    to?: string;
    amountThreshold?: ethers.BigNumberish | ((amount: ethers.BigNumber) => boolean);
  }

  export interface Metadata {
    emitter: string;
    from: string;
    to: string;
    amount: ethers.BigNumber;
  }
}

class Erc20Transfers extends Handler<Erc20Transfers.Options, Erc20Transfers.Metadata> {
  filter: (log: LogDescription) => boolean;

  constructor(options: HandlerOptions<Erc20Transfers.Options, Erc20Transfers.Metadata>) {
    super(options);

    this.filter = this._createFilter();

    if (this.options.emitter) this.options.emitter = this.options.emitter.toLowerCase();
    if (this.options.from) this.options.from = this.options.from.toLowerCase();
    if (this.options.to) this.options.to = this.options.to.toLowerCase();
  }

  private _createFilter(): (log: LogDescription) => boolean {
    return (log) => {
      if (this.options.emitter !== undefined && this.options.emitter !== log.address) {
        return false;
      }

      if (this.options.from !== undefined && this.options.from !== log.args.from) {
        return false;
      }

      if (this.options.to !== undefined && this.options.to !== log.args.to) {
        return false;
      }

      if (this.options.amountThreshold !== undefined) {
        if (typeof this.options.amountThreshold === "function" && !this.options.amountThreshold(log.args.amount)) {
          return false;
        }

        if (typeof this.options.amountThreshold !== "function" && log.args.amount.lt(this.options.amountThreshold)) {
          return false;
        }
      }

      return true;
    };
  }

  public async metadata(event: TransactionEvent | BlockEvent): Promise<Erc20Transfers.Metadata[] | null> {
    if (event instanceof BlockEvent) {
      return null;
    } else {
      return event
        .filterLog(EVENT_SIGNATURE)
        .filter(this.filter)
        .map((log) => ({
          emitter: log.args.emitter || log.address,
          from: log.args.from,
          to: log.args.to,
          amount: log.args.amount,
        })) as Erc20Transfers.Metadata[];
    }
  }
}

export default Erc20Transfers;
