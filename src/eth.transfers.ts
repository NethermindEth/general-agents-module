import { Finding, HandleTransaction, Trace, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";
import { toWei } from "web3-utils";

const DEFAULT_THRESHOLD = toWei("10");

type HandlerOptions = {
  from?: string;
  to?: string;
  valueThreshold?: string;
};

export default function provideETHTransferHandler(
  findingGenerator: FindingGenerator,
  handlerOptions?: HandlerOptions
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.traces.forEach((trace: Trace) => {
      const valueThreshold: bigint =
      handlerOptions?.valueThreshold !== undefined ? BigInt(handlerOptions.valueThreshold) : BigInt(DEFAULT_THRESHOLD);

      if (handlerOptions?.from !== undefined && handlerOptions?.from.toLowerCase() !== trace.action.from) return;
      if (handlerOptions?.to !== undefined && handlerOptions?.to.toLowerCase() !== trace.action.to) return;
      if (valueThreshold > BigInt(trace.action.value)) return;

      findings.push(findingGenerator({ from: trace.action.from, to: trace.action.to, value: trace.action.value }));
    });

    return findings;
  };
}
