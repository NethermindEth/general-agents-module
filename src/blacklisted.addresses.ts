import { FindingGenerator } from "./utils";
import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";

export default function provideBlacklistedAddresessHandler(
  findingGenerator: FindingGenerator,
  blacklistedAddresses: string[]
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const blacklistedAddressesInvolved: string[] = blacklistedAddresses.filter(
      (address: string) => txEvent.addresses[address]
    );

    if (blacklistedAddressesInvolved.length > 0) {
      findings.push(findingGenerator({ addresses: blacklistedAddresses }));
    }

    return findings;
  };
}
