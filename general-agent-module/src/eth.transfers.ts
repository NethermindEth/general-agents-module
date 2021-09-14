import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { FindingGenerator, toWei } from "./utils";

const DEFAULT_THRESHOLD = toWei("10");

type agentOptions = {
  from?: string;
  to?: string;
  valueThreshold?: string;
};

type ethTransferInfo = {
  from: string;
  to: string;
  value: string;
};

export default function provideETHTransferAgent(
  findingGenerator: FindingGenerator,
  agentOptions?: agentOptions
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const valueThreshold: bigint =
      agentOptions?.valueThreshold !== undefined ? BigInt(agentOptions.valueThreshold) : BigInt(DEFAULT_THRESHOLD);

    if (agentOptions?.from !== undefined && agentOptions?.from !== txEvent.from) {
      return [];
    }

    if (agentOptions?.to !== undefined && agentOptions?.to !== txEvent.to) {
      return [];
    }

    if (valueThreshold > BigInt(txEvent.transaction.value)) {
      return [];
    }

    return [findingGenerator({ from: txEvent.from, to: txEvent.to, value: txEvent.transaction.value })];
  };
}
