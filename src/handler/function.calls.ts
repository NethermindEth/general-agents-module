import { Finding, HandleTransaction, TransactionEvent, Trace, ethers } from "forta-agent";
import { FindingGenerator } from "./types";

interface HandlerOptions {
  from?: string;
  to?: string;
  filterOnArguments?: (values: ethers.utils.Result) => boolean;
  filterOnOutput?: (output?: ethers.utils.Result) => boolean;
  includeErrors?: boolean;
}

interface FunctionCallInfo {
  selector: string;
  from: string;
  to: string;
  arguments: ethers.utils.Result;
  output?: ethers.utils.Result;
  error: string;
}

type Filter = (functionCallInfo: FunctionCallInfo | null) => boolean;

const fromTraceActionToFunctionCallInfo = (
  iface: ethers.utils.Interface,
  functionFragment: ethers.utils.FunctionFragment,
  trace: Trace
): FunctionCallInfo | null => {
  try {
    const args = iface.decodeFunctionData(functionFragment, trace.action.input);
    const output = !trace.error ? iface.decodeFunctionResult(functionFragment, trace.result.output) : undefined;
    return {
      selector: trace.action.input.slice(0, 10),
      to: trace.action.to,
      from: trace.action.from,
      arguments: args,
      output,
      error: trace.error,
    };
  } catch {
    return null;
  }
};

const createFilter = (
  iface: ethers.utils.Interface,
  functionFragment: ethers.utils.FunctionFragment,
  options: HandlerOptions | undefined
): Filter => {
  const sighash = iface.getSighash(functionFragment);

  if (options === undefined) {
    return (functionCallInfo) => !!functionCallInfo && functionCallInfo.selector === sighash;
  }

  return (functionCallInfo) => {
    if (!functionCallInfo) return false;

    if (functionCallInfo.selector !== sighash) return false;

    if (options.from !== undefined && options.from.toLowerCase() !== functionCallInfo.from) return false;

    if (options.to !== undefined && options.to.toLowerCase() !== functionCallInfo.to) return false;

    if (options.filterOnArguments !== undefined && !options.filterOnArguments(functionCallInfo.arguments)) return false;

    if (!options.includeErrors && functionCallInfo.error) return false;

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
  findingGenerator: FindingGenerator<FunctionCallInfo>,
  func: ethers.utils.FunctionFragment | string,
  handlerOptions?: HandlerOptions
): HandleTransaction {
  const iface = new ethers.utils.Interface([func]);
  const functionFragment = ethers.utils.FunctionFragment.from(ethers.utils.Fragment.from(func));

  const filterTransferInfo: Filter = createFilter(iface, functionFragment, handlerOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    if (!txEvent.traces) {
      return [];
    }

    let traces = txEvent.traces;

    return (
      traces
        .map((trace) => fromTraceActionToFunctionCallInfo(iface, functionFragment, trace))
        .filter(filterTransferInfo)
        // @ts-ignore
        .map((functionCallInfo) => findingGenerator(functionCallInfo))
    );
  };
}
