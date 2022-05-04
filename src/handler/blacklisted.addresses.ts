import { TransactionEvent, Finding, BlockEvent } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";
import type { FindingGenerator } from "./types";

interface Options {
  addresses: string[];
}

interface Metadata {
  addresses: string[];
}

export default class BlacklistedAddresses extends Handler<Options, Metadata> {
  constructor(options: HandlerOptions<Options, Metadata>) {
    super(options);

    this.options.addresses = this.options.addresses.map((el) => el.toLowerCase());
  }

  protected async _handle(
    event: TransactionEvent | BlockEvent,
    onFinding: FindingGenerator<Metadata>
  ): Promise<Finding[]> {
    const data = await this.metadata(event);

    return data ? data.map(onFinding) : [];
  }

  public async metadata(event: TransactionEvent | BlockEvent): Promise<Metadata[] | null> {
    if (event instanceof BlockEvent) {
      return null;
    } else {
      const addresses = this.options.addresses.filter((el) => event.addresses[el]);

      return addresses.length ? [{ addresses }] : null;
    }
  }
}
