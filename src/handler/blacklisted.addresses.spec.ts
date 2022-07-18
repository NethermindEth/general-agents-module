import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";
import { generalTestFindingGenerator, TestTransactionEvent } from "../test";
import { createAddress } from "../utils";
import { FindingGenerator } from "./types";
import BlacklistedAddresses from "./blacklisted.addresses";

const testBlacklistedAddresses = [createAddress("0x0"), createAddress("0x1"), createAddress("0x2")];

describe("Blacklisted Addresses Handler Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if not blacklisted address is involved", async () => {
    const handler = new BlacklistedAddresses({
      addresses: testBlacklistedAddresses,
      onFinding: generalTestFindingGenerator,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(createAddress("0x5"));

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when a blacklisted address is involved", async () => {
    const handler = new BlacklistedAddresses({
      addresses: testBlacklistedAddresses,
      onFinding: generalTestFindingGenerator,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(testBlacklistedAddresses[0]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should return a finding when multiple blacklisted addresses are involved", async () => {
    const handler = new BlacklistedAddresses({
      addresses: testBlacklistedAddresses,
      onFinding: generalTestFindingGenerator,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(
      testBlacklistedAddresses[0],
      testBlacklistedAddresses[1]
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should return pass the correct information to the finding", async () => {
    const mockFindingGenerator: FindingGenerator<Record<string, any>> = (metadata) => metadata as Finding;

    const handler = new BlacklistedAddresses({
      addresses: testBlacklistedAddresses,
      onFinding: generalTestFindingGenerator,
    });

    handleTransaction = handler.getHandleTransaction(mockFindingGenerator);

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(
      testBlacklistedAddresses[0],
      testBlacklistedAddresses[1]
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      {
        addresses: [testBlacklistedAddresses[0], testBlacklistedAddresses[1]],
      },
    ]);
  });
});
