import { Finding, HandleTransaction, TransactionEvent, Trace } from "forta-agent";
import {
  FindingGenerator,
  encodeFunctionSignature,
  decodeFunctionCallParameters,
  extractFunctionSelector,
  extractArgumentTypes,
} from "./utils";
import { AbiItem } from "web3-utils";

interface HandlerOptions {
  from?: string;
  to?: string;
  filterOnArguments?: (values: { [key: string]: any }) => boolean;
  filterOnOutput?: (output: string) => boolean;
}

interface FunctionCallInfo {
  from: string;
  to: string;
  functionSelector: string;
  arguments: { [key: string]: any };
  output: string;
}

type Signature = string | AbiItem;
type Filter = (functionCallInfo: FunctionCallInfo) => boolean;

const fromTraceActionToFunctionCallInfo = (functionSignature: Signature, trace: Trace): FunctionCallInfo => {
  const functionSelector = extractFunctionSelector(trace.action.input);
  const argumentTypes = extractArgumentTypes(functionSignature);
  const args = decodeFunctionCallParameters(argumentTypes, trace.action.input);

  return {
    to: trace.action.to,
    from: trace.action.from,
    functionSelector,
    arguments: args,
    output: trace.result.output,
  };
};

const createFilter = (functionSignature: Signature, options: HandlerOptions | undefined): Filter => {
  if (options === undefined) {
    return (_) => true;
  }

  const expectedSelector: string = encodeFunctionSignature(functionSignature);

  return (functionCallInfo: FunctionCallInfo) => {
    if (functionCallInfo.arguments === undefined) return false;

    if (options.from !== undefined && options.from.toLowerCase() !== functionCallInfo.from) return false;

    if (options.to !== undefined && options.to.toLowerCase() !== functionCallInfo.to) return false;

    if (expectedSelector !== functionCallInfo.functionSelector) return false;

    if (options.filterOnArguments !== undefined && !options.filterOnArguments(functionCallInfo.arguments)) return false;

    if (
      options.filterOnOutput !== undefined &&
      (functionCallInfo.output === undefined || !options.filterOnOutput(functionCallInfo.output))
    ) {
      return false;
    }

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
      .map((trace) => fromTraceActionToFunctionCallInfo(functionSignature, trace))
      .filter(filterTransferInfo)
      .map((functionCallInfo: FunctionCallInfo) => findingGenerator(functionCallInfo));
  };
}
