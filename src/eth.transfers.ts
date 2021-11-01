import { Finding, HandleTransaction, Trace, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";
import { toWei } from "web3-utils";

const DEFAULT_THRESHOLD = toWei("10");

type agentOptions = {
  from?: string;
  to?: string;
  valueThreshold?: string;
};

export default function provideETHTransferHandler(
  findingGenerator: FindingGenerator,
  agentOptions?: agentOptions
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.traces.forEach((trace: Trace) => {
      const valueThreshold: bigint =
        agentOptions?.valueThreshold !== undefined ? BigInt(agentOptions.valueThreshold) : BigInt(DEFAULT_THRESHOLD);

      if (agentOptions?.from !== undefined && agentOptions?.from !== trace.action.from) return;
      if (agentOptions?.to !== undefined && agentOptions?.to !== trace.action.to) return;
      if (valueThreshold > BigInt(trace.action.value)) return;

      findings.push(findingGenerator({ from: trace.action.from, to: trace.action.to, value: trace.action.value }));
    });

    return findings;
  };
}
