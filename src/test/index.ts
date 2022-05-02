import { TestTransactionEvent } from "./test_transaction_event";
import { TestBlockEvent } from "./test_block_event";
import { Finding, FindingType, FindingSeverity } from "forta-agent";

export const generalTestFindingGenerator = (..._: any[]): Finding => {
  return Finding.fromObject({
    name: "Finding Test",
    description: "Finding for test",
    alertId: "TEST",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
  });
};

export { TestTransactionEvent, TestBlockEvent };
