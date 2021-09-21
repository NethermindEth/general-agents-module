import { Finding, HandleTransaction, Log, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";

export default function provideEventCheckerHandler(
  createFinding: FindingGenerator,
  eventSignature: string,
  address?: string,
  filter?: (log: Log, index?: number, array?: Log[]) => boolean
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (filter) {
      txEvent
        .filterEvent(eventSignature, address)
        .filter(filter)
        .map(() => findings.push(createFinding()));
    } else {
      txEvent.filterEvent(eventSignature, address).map(() => findings.push(createFinding()));
    }

    return findings;
  };
}
