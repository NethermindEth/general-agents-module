import { Finding, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "../utils";

export default function provideEventCheckerHandler(
  createFinding: FindingGenerator,
  eventSignature: string,
  address?: string,
  filter?: (log: LogDescription, index?: number, array?: LogDescription[]) => boolean
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (filter) {
      txEvent
        .filterLog(eventSignature, address)
        .filter(filter)
        .forEach((data: LogDescription) => findings.push(createFinding(data)));
    } else {
      txEvent.filterLog(eventSignature, address).forEach((data: LogDescription) => findings.push(createFinding(data)));
    }

    return findings;
  };
}
