import { Finding, HandleTransaction, TransactionEvent, Trace } from "forta-agent";
import { FindingGenerator, encodeFunctionSignature, decodeFunctionCallParameters } from "./utils";
import { AbiItem } from "web3-utils";

interface AgentOptions {
  from?: string;
  to?: string;
  filter?: (value: any) => boolean;
  filterValues?: Array<any>;
}

interface TraceInfo {
  from: string;
  to: string;
  input: string;
}

type Signature = string | AbiItem;
type Filter = (traceInfo: TraceInfo) => boolean;

const fromTraceActionToTraceInfo = (trace: Trace): TraceInfo => {
  return {
    to: trace.action.to,
    from: trace.action.from,
    input: trace.action.input,
  };
};

const createFilter = (functionSignature: Signature, options: AgentOptions | undefined): Filter => {
  if (options === undefined) {
    return (_) => true;
  }

  return (traceInfo) => {
    if (options.from !== undefined && options.from !== traceInfo.from) return false;

    if (options.to !== undefined && options.to !== traceInfo.to) return false;

    const expectedSelector: string = encodeFunctionSignature(functionSignature);
    const functionSelector: string = traceInfo.input.slice(0, 10);

    let filtered = false;

    if (options.filter && options.filterValues) {
      filtered = !options.filter(Object.values(decodeFunctionCallParameters(options.filterValues, traceInfo.input)));
    }
    if (expectedSelector !== functionSelector || filtered) return false;

    return true;
  };
};

export default function provideFunctionCallsDetectorHandler(
  findingGenerator: FindingGenerator,
  functionSignature: Signature,
  agentOptions?: AgentOptions
): HandleTransaction {
  const filterTransferInfo: Filter = createFilter(functionSignature, agentOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    if (!txEvent.traces) {
      return [];
    }

    let traces = txEvent.traces;

    return traces
      .map(fromTraceActionToTraceInfo)
      .filter(filterTransferInfo)
      .map((traceInfo: TraceInfo) => findingGenerator(traceInfo));
  };
}
