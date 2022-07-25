import { ethers, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import EthTransfers from "./eth.transfers";
import { generalTestFindingGenerator, TestTransactionEvent } from "../test";
import { createAddress } from "../utils";

const etherToWei = (ether: string) => ethers.utils.parseUnits(ether).toString();

describe("ETH Transfer Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if value is under specified threshold", async () => {
    const handler = new EthTransfers({
      onFinding: generalTestFindingGenerator,
      valueThreshold: etherToWei("100"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({ value: etherToWei("99") });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings if value is equal or greater to specified threshold ", async () => {
    const handler = new EthTransfers({
      onFinding: generalTestFindingGenerator,
      valueThreshold: etherToWei("100"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { value: etherToWei("100") },
      { value: etherToWei("1000") },
      { value: etherToWei("10") }
    );
    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });

  it("should return empty findings if transaction are not from the specified address", async () => {
    const handler = new EthTransfers({
      onFinding: generalTestFindingGenerator,
      from: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: etherToWei("15"),
      from: createAddress("0x13"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings if transactions are from the specified address", async () => {
    const handler = new EthTransfers({
      onFinding: generalTestFindingGenerator,
      from: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: etherToWei("15"),
      from: createAddress("0x12"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should return empty findings if transactions are not to specified address", async () => {
    const handler = new EthTransfers({
      onFinding: generalTestFindingGenerator,
      to: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: etherToWei("15"),
      to: createAddress("0x13"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings if transactions are to specified address", async () => {
    const handler = new EthTransfers({
      onFinding: generalTestFindingGenerator,
      to: createAddress("0x12"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: etherToWei("15"),
      to: createAddress("0x12"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should return findings only when all the specified conditions are met", async () => {
    const handler = new EthTransfers({
      onFinding: generalTestFindingGenerator,
      from: createAddress("0x12"),
      to: createAddress("0x13"),
      valueThreshold: etherToWei("50"),
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { value: etherToWei("100"), from: createAddress("0x13") },
      { value: etherToWei("100"), from: createAddress("0x12") },
      { value: etherToWei("40"), from: createAddress("0x12"), to: createAddress("0x13") },
      { value: etherToWei("80"), from: createAddress("0x12"), to: createAddress("0x13") },
      { value: etherToWei("800"), from: createAddress("0x13"), to: createAddress("0x1") },
      { value: etherToWei("50"), from: createAddress("0x12"), to: createAddress("0x13") }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });
});
