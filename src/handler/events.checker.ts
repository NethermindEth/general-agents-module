import { Finding, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./types";

export default function provideEventCheckerHandler(
  findingGenerator: FindingGenerator<LogDescription>,
  eventSignature: string,
  address?: string,
  filter?: (log: LogDescription, index?: number, array?: LogDescription[]) => boolean
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let logDescriptions = txEvent.filterLog(eventSignature, address);

    if (filter) logDescriptions = logDescriptions.filter(filter);

    return logDescriptions.map((logDescription) => findingGenerator(logDescription));
  };
}
