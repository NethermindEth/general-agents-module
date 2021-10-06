import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";
import { createAddress, generalTestFindingGenerator, TestTransactionEvent } from "./tests.utils";

const testBlacklistedAddresses = [createAddress("0x0"), createAddress("0x1")];

describe("Blacklisted Addresses Agent Tests", () => {
  let handleTrasaction: HandleTransaction;

  it("should returns empty findings if not blacklisted address is involved", async () => {
    handleTrasaction = providehandler(generalTestFindingGenerator);

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddress(createAddress("0x5"));

    const findings: Finding[] = await handleTrasaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding when a blacklisted address is involved", async () => {
    handleTrasaction = provideHandler(generalTestFindingGenerator);

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddress(testBlacklistedAddresses[0]);

    const findings: Finding[] = await handleTrasaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should returns a finding when multiple blacklisted addresses are involved", async () => {
    handleTrasaction = provideHandler(generalTestFindingGenerator);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddress(testBlacklistedAddresses[0])
      .addInvolvedAddress(testBlacklistedAddresses[1]);

    const findings: Finding[] = await handleTrasaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });
});
