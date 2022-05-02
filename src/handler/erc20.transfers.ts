import { LogDescription } from "@ethersproject/abi";
import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./types";

const EVENT_SIGNATURE = "event Transfer(address indexed from, address indexed to, uint256 amount)";

type HandlerOptions = {
  from?: string;
  to?: string;
  amountThreshold?: string;
};

type TransferInfo = {
  from: string;
  to: string;
  amount: string;
};

const fromLogToTransferInfo = (log: LogDescription): TransferInfo => {
  return {
    to: log.args.to.toLowerCase(),
    from: log.args.from.toLowerCase(),
    amount: log.args.amount.toString(),
  };
};

const createFilter = (options: HandlerOptions | undefined): ((transferInfo: TransferInfo) => boolean) => {
  if (options === undefined) {
    return (_) => true;
  }

  return (transferInfo) => {
    if (options.from !== undefined && options.from.toLowerCase() !== transferInfo.from) {
      return false;
    }

    if (options.to !== undefined && options.to.toLowerCase() !== transferInfo.to) {
      return false;
    }

    if (options.amountThreshold !== undefined && BigInt(options.amountThreshold) > BigInt(transferInfo.amount)) {
      return false;
    }

    return true;
  };
};

export default function provideERC20TransferHandler(
  findingGenerator: FindingGenerator<TransferInfo>,
  tokenAddress: string,
  handlerOptions?: HandlerOptions
): HandleTransaction {
  const filterTransferInfo: (transferInfo: TransferInfo) => boolean = createFilter(handlerOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    return txEvent
      .filterLog(EVENT_SIGNATURE, tokenAddress)
      .map(fromLogToTransferInfo)
      .filter(filterTransferInfo)
      .map((transferInfo) => findingGenerator(transferInfo));
  };
}
