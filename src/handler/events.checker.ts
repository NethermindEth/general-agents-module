import { Finding, LogDescription, TransactionEvent, BlockEvent } from "forta-agent";
import { Handler, HandlerOptions } from "./handler";
import { FindingGenerator } from "./types";

interface Options {
  emitter?: string;
  signature: string;
  filter?: (log: LogDescription, index?: number, array?: LogDescription[]) => boolean;
}

interface Metadata extends LogDescription {}

export default class EventEmission extends Handler<Options, Metadata> {
  constructor(options: HandlerOptions<Options, Metadata>) {
    super(options);

    if (this.options.emitter) this.options.emitter = this.options.emitter.toLowerCase();
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
      const logs = event.filterLog(this.options.signature, this.options.emitter);
      return this.options.filter ? logs.filter(this.options.filter) : logs;
    }
  }
}
