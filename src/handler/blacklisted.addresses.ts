import { TransactionEvent, BlockEvent } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";

namespace BlacklistedAddresses {
  export interface Options {
    addresses: string[];
  }

  export interface Metadata {
    addresses: string[];
  }
}

class BlacklistedAddresses extends Handler<BlacklistedAddresses.Options, BlacklistedAddresses.Metadata> {
  constructor(options: HandlerOptions<BlacklistedAddresses.Options, BlacklistedAddresses.Metadata>) {
    super(options);

    this.options.addresses = this.options.addresses.map((el) => el.toLowerCase());
  }

  public async metadata(event: TransactionEvent | BlockEvent): Promise<BlacklistedAddresses.Metadata[] | null> {
    if (event instanceof BlockEvent) {
      return null;
    } else {
      const addresses = this.options.addresses.filter((el) => event.addresses[el]);

      return addresses.length ? [{ addresses }] : null;
    }
  }
}

export default BlacklistedAddresses;
