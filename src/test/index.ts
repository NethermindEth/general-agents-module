import { TestTransactionEvent } from "./test_transaction_event";
import { TestBlockEvent } from "./test_block_event";
import MockEthersProvider from "./mock_ethers_provider";
import MockEthersSigner from "./mock_ethers_signer";
import { MockTransactionData } from "./mock_transaction_data";

import {
  Finding,
  FindingType,
  FindingSeverity,
  BlockEvent,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";

export interface Bot {
  handleTransaction: HandleTransaction;
  handleBlock: HandleBlock;
}

export const runBlock = async (bot: Bot, block: BlockEvent, ...txns: TransactionEvent[]): Promise<Finding[]> => {
  let findings: Finding[] = [];

  findings.push(...(await bot.handleBlock(block)));
  for (let tx of txns) findings.push(...(await bot.handleTransaction(tx)));

  return findings;
};

export const generalTestFindingGenerator = (..._: any[]): Finding => {
  return Finding.fromObject({
    name: "Finding Test",
    description: "Finding for test",
    alertId: "TEST",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
  });
};

export { TestTransactionEvent, TestBlockEvent, MockEthersProvider, MockEthersSigner, MockTransactionData };
