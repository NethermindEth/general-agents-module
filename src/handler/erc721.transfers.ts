import { LogDescription, TransactionEvent, ethers, BlockEvent } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";

const EVENT_SIGNATURE = "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)";

namespace Erc721Transfers {
  export interface Options {
    emitter?: string;
    from?: string;
    to?: string;
    tokenId?: ethers.BigNumberish | ((amount: ethers.BigNumber) => boolean);
    amountThreshold?: ethers.BigNumberish | ((amount: ethers.BigNumber) => boolean);
  }

  export interface Metadata {
    emitter: string;
    from: string;
    to: string;
    tokenId: ethers.BigNumber;
    amount: ethers.BigNumber;
  }
}

class Erc721Transfers extends Handler<Erc721Transfers.Options, Erc721Transfers.Metadata> {
  filter: (log: LogDescription) => boolean;

  constructor(options: HandlerOptions<Erc721Transfers.Options, Erc721Transfers.Metadata>) {
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

      if (this.options.tokenId !== undefined) {
        if (typeof this.options.tokenId === "function" && !this.options.tokenId(log.args.tokenId)) {
          return false;
        }

        if (typeof this.options.tokenId !== "function" && !log.args.tokenId.eq(this.options.tokenId)) {
          return false;
        }
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

  public async metadata(event: TransactionEvent | BlockEvent): Promise<Erc721Transfers.Metadata[] | null> {
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
          tokenId: log.args.tokenId,
          amount: log.args.amount,
        })) as Erc721Transfers.Metadata[];
    }
  }
}

export default Erc721Transfers;
