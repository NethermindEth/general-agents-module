import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideETHTransferHandler from "./eth.transfers";
import { generalTestFindingGenerator, TestTransactionEvent } from "../test";
import { createAddress } from "../utils";
import { toWei } from "web3-utils";

describe("ETH Transfer Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should returns empty findings if no threshold was specified and transactions are below 10 ETH", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator);

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { value: toWei("9") },
      { value: toWei("8") },
      { value: toWei("1") }
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if no threshold was specified and transactions are 10 ETH or more", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator);

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { value: toWei("10") },
      { value: toWei("2") },
      { value: toWei("100") },
      { value: toWei("3") }
    );
    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });

  it("should returns empty findings if value is under specified threshold", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator, { valueThreshold: toWei("100") });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({ value: toWei("99") });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns findings if value is equal or greater to specified threshold ", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator, { valueThreshold: toWei("100") });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { value: toWei("100") },
      { value: toWei("1000") },
      { value: toWei("10") }
    );
    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });

  it("should returns empty findings if transaction are not from the specified address", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator, { from: createAddress("0x12") });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      from: createAddress("0x13"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns findings if transactions are from the specified address", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator, { from: createAddress("0x12") });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      from: createAddress("0x12"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should returns empty findings if transactions are not to specified address", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator, { to: createAddress("0x12") });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      to: createAddress("0x13"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns findings if transactions are to specified address", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator, { to: createAddress("0x12") });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      value: toWei("15"),
      to: createAddress("0x12"),
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should returns findings only when all the specified conditions are met", async () => {
    handleTransaction = provideETHTransferHandler(generalTestFindingGenerator, {
      from: createAddress("0x12"),
      to: createAddress("0x13"),
      valueThreshold: toWei("50"),
    });

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
