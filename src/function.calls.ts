import { Finding, HandleTransaction, TransactionEvent, Trace } from "forta-agent";
import { FindingGenerator, encodeFunctionSignature, decodeFunctionCallParameters } from "./utils";
import { AbiItem } from "web3-utils";

interface HandlerOptions {
  from?: string;
  to?: string;
  filter?: (value: any) => boolean;
  filterValues?: Array<any>;
}

interface FunctionCallInfo {
  from: string;
  to: string;
  input: string;
}

type Signature = string | AbiItem;
type Filter = (functionCallInfo: FunctionCallInfo) => boolean;

const fromTraceActionToFunctionCallInfo = (trace: Trace): FunctionCallInfo => {
  return {
    to: trace.action.to,
    from: trace.action.from,
    input: trace.action.input,
  };
};

const createFilter = (functionSignature: Signature, options: HandlerOptions | undefined): Filter => {
  if (options === undefined) {
    return (_) => true;
  }

  return (functionCallInfo) => {
    if (options.from !== undefined && options.from !== functionCallInfo.from) return false;

    if (options.to !== undefined && options.to !== functionCallInfo.to) return false;

    const expectedSelector: string = encodeFunctionSignature(functionSignature);
    const functionSelector: string = functionCallInfo.input.slice(0, 10);

    let filtered = false;

    if (options.filter && options.filterValues) {
      filtered = !options.filter(Object.values(decodeFunctionCallParameters(options.filterValues, functionCallInfo.input)));
    }
    if (expectedSelector !== functionSelector || filtered) return false;

    return true;
  };
};

export default function provideFunctionCallsDetectorHandler(
  findingGenerator: FindingGenerator,
  functionSignature: Signature,
  handlerOptions?: HandlerOptions 
): HandleTransaction {
  const filterTransferInfo: Filter = createFilter(functionSignature, handlerOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    if (!txEvent.traces) {
      return [];
    }

    let traces = txEvent.traces;

    return traces
      .map(fromTraceActionToFunctionCallInfo)
      .filter(filterTransferInfo)
      .map((functionCallInfo: FunctionCallInfo) => findingGenerator(functionCallInfo));
  };
}
