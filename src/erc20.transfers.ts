import { Finding, HandleTransaction, TransactionEvent, Log } from "forta-agent";
import { FindingGenerator, decodeParameter } from "./utils";

const EVENT_SIGNATURE = "Transfer(address,address,uint256)";

type HandlerOptions = {
  from?: string;
  to?: string;
  amountThreshold?: string;
};

type transferInfo = {
  from: string;
  to: string;
  amount: any;
};

const fromLogToTransferInfo = (log: Log): transferInfo => {
  return {
    to: decodeParameter("address", log.topics[2]).toLowerCase(),
    from: decodeParameter("address", log.topics[1]).toLowerCase(),
    amount: decodeParameter("uint256", log.data),
  };
};

const createFilter = (options: HandlerOptions | undefined): ((transferInfo: transferInfo) => boolean) => {
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
  findingGenerator: FindingGenerator,
  tokenAddress: string,
  handlerOptions?: HandlerOptions
): HandleTransaction {
  const filterTransferInfo: (transferInfo: transferInfo) => boolean = createFilter(handlerOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    return txEvent
      .filterEvent(EVENT_SIGNATURE, tokenAddress)
      .map(fromLogToTransferInfo)
      .filter(filterTransferInfo)
      .map((transferInfo) => findingGenerator(transferInfo));
  };
}
