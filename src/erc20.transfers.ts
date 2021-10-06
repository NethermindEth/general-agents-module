import { Finding, HandleTransaction, TransactionEvent, Log } from "forta-agent";
import { FindingGenerator, decodeParameter } from "./utils";

const EVENT_SIGNATURE = "Transfer(address,address,uint256)";

type agentOptions = {
  from?: string;
  to?: string;
  amountThreshold?: string;
};

type transferInfo = {
  from: string;
  to: string;
  amount: string;
};

const fromLogToTransferInfo = (log: Log): transferInfo => {
  return {
    to: decodeParameter("address", log.topics[2]) as any,
    from: decodeParameter("address", log.topics[1]) as any,
    amount: decodeParameter("uint256", log.data) as any,
  };
};

const createFilter = (options: agentOptions | undefined): ((transferInfo: transferInfo) => boolean) => {
  if (options === undefined) {
    return (_) => true;
  }

  return (transferInfo) => {
    if (options.from !== undefined && options.from !== transferInfo.from) {
      return false;
    }

    if (options.to !== undefined && options.to !== transferInfo.to) {
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
  agentOptions?: agentOptions
): HandleTransaction {
  const filterTransferInfo: (transferInfo: transferInfo) => boolean = createFilter(agentOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    return txEvent
      .filterEvent(EVENT_SIGNATURE, tokenAddress)
      .map(fromLogToTransferInfo)
      .filter(filterTransferInfo)
      .map((transferInfo) => findingGenerator(transferInfo));
  };
}
