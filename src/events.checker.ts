import { Finding, HandleTransaction, Log, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";

interface EventData {
  topics: string[];
  data: string;
  address: string;
}

function eventData(log: Log): EventData {
  return {
    topics: log.topics,
    data: log.data,
    address: log.address,
  };
}

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
        .map(eventData)
        .map((data: EventData) => findings.push(createFinding(data)));
    } else {
      txEvent
        .filterEvent(eventSignature, address)
        .map(eventData)
        .map((data: EventData) => findings.push(createFinding(data)));
    }

    return findings;
  };
}
