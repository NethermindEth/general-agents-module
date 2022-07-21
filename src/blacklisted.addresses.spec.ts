import { HandleTransaction, TransactionEvent, Finding } from "forta-agent";
import { createAddress, generalTestFindingGenerator, TestTransactionEvent } from "./tests.utils";
import { FindingGenerator } from "./utils";
import provideBlacklistedAddresessHandler from "./blacklisted.addresses";

const testBlacklistedAddresses = [createAddress("0x0"), createAddress("0x1"), createAddress("0x2")];

describe("Blacklisted Addresses Handler Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should returns empty findings if not blacklisted address is involved", async () => {
    handleTransaction = provideBlacklistedAddresessHandler(generalTestFindingGenerator, testBlacklistedAddresses);

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(createAddress("0x5"));

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding when a blacklisted address is involved", async () => {
    handleTransaction = provideBlacklistedAddresessHandler(generalTestFindingGenerator, testBlacklistedAddresses);

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(testBlacklistedAddresses[0]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should returns a finding when multiple blacklisted addresses are involved", async () => {
    handleTransaction = provideBlacklistedAddresessHandler(generalTestFindingGenerator, testBlacklistedAddresses);

    const txEvent: TransactionEvent = new TestTransactionEvent().addInvolvedAddresses(
      testBlacklistedAddresses[0],
      testBlacklistedAddresses[1]
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });

  it("should return pass the correct information to the finding", async () => {
    const mockFindingGenerator: FindingGenerator = (metadata: { [key: string]: any } | undefined): Finding =>
      metadata as Finding;

    handleTransaction = provideBlacklistedAddresessHandler(mockFindingGenerator, testBlacklistedAddresses);

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
