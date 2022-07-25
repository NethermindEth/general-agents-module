import type { BlockEvent, Finding, HandleBlock, HandleTransaction, TransactionEvent } from "forta-agent";
import type { FindingGenerator } from "./types";

export type HandlerOptions<Options, Metadata> = Options & { onFinding?: FindingGenerator<Metadata> };

export abstract class Handler<Options, Metadata> {
  options: HandlerOptions<Options, Metadata>;

  constructor(options: HandlerOptions<Options, Metadata>) {
    this.options = options;
  }

  private _checkOnFinding(onFinding?: FindingGenerator<Metadata>) {
    if (!onFinding && !this.options.onFinding) {
      throw new Error("Handler doesn't have a finding generator");
    }
  }

  public handle(event: TransactionEvent | BlockEvent, onFinding?: FindingGenerator<Metadata>): Promise<Finding[]> {
    this._checkOnFinding(onFinding);

    return this._handle(event, (onFinding || this.options.onFinding)!);
  }

  protected async _handle(
    event: TransactionEvent | BlockEvent,
    onFinding: FindingGenerator<Metadata>
  ): Promise<Finding[]> {
    const data = await this.metadata(event);

    return data ? data.map(onFinding) : [];
  }

  public abstract metadata(event: TransactionEvent | BlockEvent): Promise<Metadata[] | null>;

  public getHandleBlock(onFinding?: FindingGenerator<Metadata>): HandleBlock {
    this._checkOnFinding(onFinding);

    return async (event) => await this.handle(event, onFinding || this.options.onFinding);
  }

  public getHandleTransaction(onFinding?: FindingGenerator<Metadata>): HandleTransaction {
    this._checkOnFinding(onFinding);

    return async (event) => await this.handle(event, onFinding || this.options.onFinding);
  }
}
