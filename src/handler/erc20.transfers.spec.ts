import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { generalTestFindingGenerator, TestTransactionEvent } from "../test";
import { createAddress } from "../utils";
import provideERC20TransferHandler from "./erc20.transfers";
import { FindingGenerator } from "./types";

const TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const createTransactionEventWithTransferLog = (
  tokenAddress: string,
  from: string,
  to: string,
  amount: string
): TransactionEvent => {
  return new TestTransactionEvent().addEventLog(
    "event Transfer(address indexed from, address indexed to, uint256 amount)",
    tokenAddress,
    [from, to, amount]
  );
};

describe("ERC20 Transfer Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if the expected event wasn't emitted", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("event BadSignature()", TOKEN_ADDRESS);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the expected event wasn't emitted from the correct token", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      "0x0",
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding only if the expected event was emitted from the correct token", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should return a finding only if the event has in the field `to` the correct address", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS, {
      to: createAddress("0x12"),
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x12"),
      "0"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("should return a finding only if the event has in the field `from` the correct address", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS, {
      from: createAddress("0x12"),
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x12"),
      createAddress("0x0"),
      "0"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("should return a finding only if the event has in the field `value` a value greater than the specified threshold", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS, {
      amountThreshold: "350",
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "300"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x12"),
      createAddress("0x0"),
      "350"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);

    const txEvent3: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x12"),
      createAddress("0x0"),
      "360"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2), generalTestFindingGenerator(txEvent3)]);
  });

  it("should not compare thresholds using lexicographic order", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS, {
      amountThreshold: "10",
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "2"
    );
    const findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding only if all the conditions are met", async () => {
    handleTransaction = provideERC20TransferHandler(generalTestFindingGenerator, TOKEN_ADDRESS, {
      from: createAddress("0x1"),
      to: createAddress("0x2"),
      amountThreshold: "350",
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x2"),
      "300"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x0"),
      "350"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([]);

    const txEvent3: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x3"),
      createAddress("0x2"),
      "360"
    );
    findings = findings.concat(await handleTransaction(txEvent3));
    expect(findings).toStrictEqual([]);

    const txEvent4: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x2"),
      "360"
    );
    findings = findings.concat(await handleTransaction(txEvent4));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent4)]);
  });

  it("should pass correct metadata to findingGenerator", async () => {
    const findingGenerator: FindingGenerator<Record<string, any>> = (metadata) => {
      return Finding.fromObject({
        name: "testName",
        description: "testDescription",
        alertId: "testId",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          from: metadata?.from,
          to: metadata?.to,
          amount: metadata?.amount,
        },
      });
    };
    handleTransaction = provideERC20TransferHandler(findingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x2"),
      "300"
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      findingGenerator({ from: createAddress("0x1"), to: createAddress("0x2"), amount: "300" }),
    ]);
  });
});
