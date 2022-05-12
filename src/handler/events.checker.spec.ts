import {
  HandleTransaction,
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  LogDescription,
} from "forta-agent";
import { BigNumber } from "ethers";
import { generalTestFindingGenerator, TestTransactionEvent } from "../test";
import { createAddress } from "../utils";
import { FindingGenerator } from "./types";
import EventEmission from "./events.checker";

const TEST_EVENT = "event Test(bool testBool, uint256 testUint256, address indexed testAddress)";

const findingGenerator: FindingGenerator<Record<string, any>> = (event) => {
  return Finding.fromObject({
    name: "Finding Test",
    description: "Finding for test",
    alertId: "TEST",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {
      args: JSON.stringify(event?.args).toLowerCase(),
      address: event?.address.toLowerCase(),
    },
  });
};

describe("Event Checker Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if expected event is not found", async () => {
    const handler = new EventEmission({
      onFinding: generalTestFindingGenerator,
      signature: TEST_EVENT,
    });

    handleTransaction = handler.getHandleTransaction();
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("event BadSignature()", "0x121212");

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the event wasn't emitted from the correct address", async () => {
    const handler = new EventEmission({
      onFinding: generalTestFindingGenerator,
      signature: TEST_EVENT,
      emitter: "0x131313",
    });

    handleTransaction = handler.getHandleTransaction();
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, "0x1212", [
      true,
      "0xf00d",
      createAddress("0xbeef"),
    ]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if expected event was emitted from the correct address", async () => {
    const handler = new EventEmission({
      onFinding: generalTestFindingGenerator,
      signature: TEST_EVENT,
      emitter: "0x121212",
    });

    handleTransaction = handler.getHandleTransaction();
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, "0x121212", [
      true,
      "0xf00d",
      createAddress("0xbeef"),
    ]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should return findings every time the expected event is emitted from any address if no address was specified", async () => {
    const handler = new EventEmission({
      onFinding: generalTestFindingGenerator,
      signature: TEST_EVENT,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, "0x121212", [
      true,
      "0xf00d",
      createAddress("0xbeef"),
    ]);

    let findings: Finding[] = await handleTransaction(txEvent1);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, "0x131313", [
      true,
      "0xf00d",
      createAddress("0xbeef"),
    ]);

    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1), generalTestFindingGenerator(txEvent2)]);
  });

  it("should return findings only when then event is emitted from the correct address", async () => {
    const handler = new EventEmission({
      onFinding: generalTestFindingGenerator,
      signature: TEST_EVENT,
      emitter: "0x121212",
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, "0x121212", [
      true,
      "0xf00d",
      createAddress("0xbeef"),
    ]);

    let findings: Finding[] = await handleTransaction(txEvent1);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, "0x131313", [
      true,
      "0xf00d",
      createAddress("0xbeef"),
    ]);

    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1)]);
  });

  it("should return empty findings with filtered function", async () => {
    const filterLog = (log: LogDescription): boolean => {
      return log.args.testUint256.div(BigNumber.from(10).pow(18)).gt(2);
    };

    const handler = new EventEmission({
      onFinding: generalTestFindingGenerator,
      signature: TEST_EVENT,
      emitter: "0x121212",
      filter: filterLog,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      TEST_EVENT,
      "0x121212",
      [true, "0xeebe0b40e8000", createAddress("0xbeef")] // testUint256: 0.0042e+18
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings with filtered function if condition met", async () => {
    const filterLog = (log: LogDescription): boolean => {
      return log.args.testUint256.div(BigNumber.from(10).pow(18)).gt(2);
    };

    const handler = new EventEmission({
      onFinding: generalTestFindingGenerator,
      signature: TEST_EVENT,
      emitter: "0x121212",
      filter: filterLog,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      TEST_EVENT,
      "0x121212",
      [true, "0x29a2241af62c0000", createAddress("0xbeef")] // testUint256: 3e+18
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should return findings with metadata if condition met", async () => {
    const filterLog = (log: LogDescription): boolean => {
      return log.args.testUint256.div(BigNumber.from(10).pow(18)).gt(2);
    };

    const address = "0x121212";

    const handler = new EventEmission({
      onFinding: findingGenerator,
      signature: TEST_EVENT,
      emitter: address,
      filter: filterLog,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, address, [
      true,
      "0x29a2241af62c0000",
      createAddress("0xbeef"),
    ]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      findingGenerator({
        args: [true, BigNumber.from("0x29a2241af62c0000"), createAddress("0xbeef")],
        address: address,
      }),
    ]);
  });

  it("should return findings with metadata if the event was emitted and no conditions were set", async () => {
    const address: string = "0x121212A";

    const handler = new EventEmission({
      onFinding: findingGenerator,
      signature: TEST_EVENT,
      emitter: address,
    });

    handleTransaction = handler.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(TEST_EVENT, address, [
      false,
      "0x29a2241af62c0000",
      createAddress("0xbeef"),
    ]);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      findingGenerator({
        args: [false, BigNumber.from("0x29a2241af62c0000"), createAddress("0xbeef")],
        address: address,
      }),
    ]);
  });
});
