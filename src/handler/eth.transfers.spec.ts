import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import EthTransfer from "./eth.transfers";
import { generalTestFindingGenerator, TestTransactionEvent } from "../test";
import { createAddress } from "../utils";
import { toWei } from "web3-utils";

describe("ETH Transfer Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if value is under specified threshold", async () => {
    const handler = new EthTransfer({
      onFinding: generalTestFindingGenerator,
      valueThreshold: toWei("100"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({ value: toWei("99") });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings if value is equal or greater to specified threshold ", async () => {
    const handler = new EthTransfer({
      onFinding: generalTestFindingGenerator,
      valueThreshold: toWei("100"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { value: toWei("100") },
      { value: toWei("1000") },
      { value: toWei("10") }
    );
    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });

  it("should return empty findings if transaction are not from the specified address", async () => {
    const handler = new EthTransfer({
      onFinding: generalTestFindingGenerator,
      from: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      from: createAddress("0x13"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings if transactions are from the specified address", async () => {
    const handler = new EthTransfer({
      onFinding: generalTestFindingGenerator,
      from: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      from: createAddress("0x12"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should return empty findings if transactions are not to specified address", async () => {
    const handler = new EthTransfer({
      onFinding: generalTestFindingGenerator,
      to: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      to: createAddress("0x13"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings if transactions are to specified address", async () => {
    const handler = new EthTransfer({
      onFinding: generalTestFindingGenerator,
      to: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      to: createAddress("0x12"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should return findings only when all the specified conditions are met", async () => {
    const handler = new EthTransfer({
      onFinding: generalTestFindingGenerator,
      from: createAddress("0x12"),
      to: createAddress("0x13"),
      valueThreshold: toWei("50"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { value: toWei("100"), from: createAddress("0x13") },
      { value: toWei("100"), from: createAddress("0x12") },
      { value: toWei("40"), from: createAddress("0x12"), to: createAddress("0x13") },
      { value: toWei("80"), from: createAddress("0x12"), to: createAddress("0x13") },
      { value: toWei("800"), from: createAddress("0x13"), to: createAddress("0x1") },
      { value: toWei("50"), from: createAddress("0x12"), to: createAddress("0x13") }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });
});
