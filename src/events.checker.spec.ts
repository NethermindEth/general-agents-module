import { HandleTransaction, Finding, TransactionEvent, Log, FindingSeverity, FindingType } from "forta-agent";
import { generalTestFindingGenerator, TestTransactionEvent } from "./tests.utils";
import provideEventCheckerHandler from "./events.checker";
import { FindingGenerator, metadataVault } from "./utils";
import { keccak256 } from "forta-agent/dist/sdk/utils";

const EVENT_SIGNATURE = "testSignature(bool,address)";

const findingGenerator: FindingGenerator = (event?: metadataVault): Finding =>
  Finding.fromObject({
    name: "Finding Test",
    description: "Finding for test",
    alertId: "TEST",
    severity: FindingSeverity.Low,
    type: FindingType.Unknown,
    metadata: {
      topics: JSON.stringify(event?.topics),
      data: event?.data,
      address: event?.address,
    },
  });

describe("Event Checker Agent Tests", () => {
  let transactionHandler: HandleTransaction;

  it("should returns empty findings if expected event is not found", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("badSignature", "0x121212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if the event wasn't emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x131313");
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x1212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding if expected event was emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should returns findings every time the expected event is emitted from any address if no address was specified", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE);

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");
    let findings: Finding[] = await transactionHandler(txEvent1);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x131313");
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1), generalTestFindingGenerator(txEvent2)]);
  });

  it("should returns findings only when then event is emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");
    let findings: Finding[] = await transactionHandler(txEvent1);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x131313");
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1)]);
  });

  it("should returns empty findings with filtered function", async () => {
    const filterLog = (log: Log): boolean => {
      const number = Number(BigInt(log.data)) / 10 ** 18;
      if (number > 2) {
        return true;
      }

      return false;
    };

    transactionHandler = provideEventCheckerHandler(
      generalTestFindingGenerator,
      EVENT_SIGNATURE,
      "0x121212",
      filterLog
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      "0x121212",
      [],
      "0x000000000000000000000000000000000000000000000000000eebe0b40e8000" // 0.0042
    );
    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns findings with filtered function if condition met", async () => {
    const filterLog = (log: Log): boolean => {
      const number = Number(BigInt(log.data)) / 10 ** 18;
      if (number > 2) {
        return true;
      }

      return false;
    };

    transactionHandler = provideEventCheckerHandler(
      generalTestFindingGenerator,
      EVENT_SIGNATURE,
      "0x121212",
      filterLog
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      "0x121212",
      [],
      "0x00000000000000000000000000000000000000000000000029a2241af62c0000" // 3
    );
    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should returns findings with metadata if condition met", async () => {
    const filterLog = (log: Log): boolean => {
      const number = Number(BigInt(log.data)) / 10 ** 18;
      if (number > 2) {
        return true;
      }

      return false;
    };

    const address: string = "0x121212";
    const topics: string[] = ["0x10", "0x20", "0x30"];
    const data: string = "0x00000000000000000000000000000000000000000000000029a2241af62c0000"; // 3

    transactionHandler = provideEventCheckerHandler(
      findingGenerator,
      EVENT_SIGNATURE,
      address,
      filterLog
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      address,
      topics,
      data,
    );
    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([
      findingGenerator({
        topics: [keccak256(EVENT_SIGNATURE), ...topics], 
        address: address, 
        data: data,
      }),
    ]);
  });

  it("should returns findings with metadata if the event was emitted", async () => {
    const address: string = "0x121212A";
    const topics: string[] = ["0xA", "0xB", "0xC"];
    const data: string = "0x00000000000000000000000000000000000000000000000029a2241af62c0000";

    transactionHandler = provideEventCheckerHandler(
      findingGenerator,
      EVENT_SIGNATURE,
      address,
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      address,
      topics,
      data,
    );
    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([
      findingGenerator({
        topics: [keccak256(EVENT_SIGNATURE), ...topics], 
        address: address, 
        data: data,
      }),
    ]);
  });
});
