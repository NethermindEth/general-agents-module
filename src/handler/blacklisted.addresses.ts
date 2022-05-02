import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";
import { FindingGenerator } from "./types";

export default function provideBlacklistedAddresessHandler(
  findingGenerator: FindingGenerator<{ addresses: string[] }>,
  blacklistedAddresses: string[]
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const blacklistedAddressesInvolved: string[] = blacklistedAddresses.filter(
      (address: string) => txEvent.addresses[address.toLowerCase()]
    );

    if (blacklistedAddressesInvolved.length > 0) {
      return [findingGenerator({ addresses: blacklistedAddressesInvolved })];
    } else {
      return [];
    }
  };
}
