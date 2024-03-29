import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent, generalTestFindingGenerator } from "../test";
import { createAddress } from "../utils";
import TraceCalls from "./trace.calls";

describe("Function calls detector Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if the expected function wasn't called", async () => {
    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function func()"],
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not break if no trace is passed", async () => {
    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function func()"],
      to: createAddress("0x0"),
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent: TransactionEvent = {
      addresses: { "0x": true },
    } as any;
    let findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return findings only if the trace satisfies the `includeError` condition", async () => {
    let traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function func()"],
      includeErrors: true,
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({ function: "function func()" });
    txEvent1.traces[0].error = "error";

    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1)]);

    traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function func()"],
    });

    handleTransaction = traceCalls.getHandleTransaction();

    findings = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);
  });

  it("should return findings only if the function is called in the contract target `to`", async () => {
    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function func()"],
      to: createAddress("0x0"),
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      to: createAddress("0x1"),
    });

    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      to: createAddress("0x0"),
    });

    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("should return findings only if the function is called from the caller target `from`", async () => {
    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function func()"],
      from: createAddress("0x0"),
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      from: createAddress("0x1"),
    });

    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      from: createAddress("0x0"),
    });

    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("should return a finding only if all the conditions are met", async () => {
    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function func()"],
      from: createAddress("0x1"),
      to: createAddress("0x2"),
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      from: createAddress("0x0"),
      to: createAddress("0x2"),
    });

    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      from: createAddress("0x1"),
      to: createAddress("0x0"),
    });

    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([]);

    const txEvent3: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      from: createAddress("0x0"),
      to: createAddress("0x3"),
    });

    findings = findings.concat(await handleTransaction(txEvent3));
    expect(findings).toStrictEqual([]);

    const txEvent4: TransactionEvent = new TestTransactionEvent().addTraces({
      function: "function func()",
      from: createAddress("0x1"),
      to: createAddress("0x2"),
    });

    findings = findings.concat(await handleTransaction(txEvent4));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent4)]);
  });

  it("should pass correct metadata to onFinding", async () => {
    const functionDefinition = "function myMethod(uint256 myNumber, string myString) returns (uint256, address)";

    const args = ["0x2345675643", "Hello!"];
    const to = createAddress("0x1");
    const from = createAddress("0x2");
    const output = ["0x20", createAddress("0x1")];

    const traceCalls = new TraceCalls({
      onFinding(metadata: TraceCalls.Metadata): Finding {
        return Finding.fromObject({
          name: "Test Name",
          description: "Test Description",
          alertId: "Test Id",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
          metadata: {
            from: metadata?.from,
            to: metadata?.to,
            selector: metadata?.sighash,
            arguments: metadata?.args,
            output: metadata?.output,
          } as unknown as Record<string, string>,
        });
      },
      signatures: [functionDefinition],
      to,
      from,
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      function: functionDefinition,
      from,
      to,
      arguments: args,
      output,
    });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toHaveProperty("metadata.from", from);
    expect(findings[0]).toHaveProperty("metadata.to", to);
    expect(findings[0]).toHaveProperty("metadata.selector", "0x24ee0097"); // keccak256("myMethod(uint256,string)")[0..3]
    expect(findings[0]).toHaveProperty("metadata.arguments.0._hex", args[0]);
    expect(findings[0]).toHaveProperty("metadata.arguments.1", args[1]);
    expect(findings[0]).toHaveProperty("metadata.output.0._hex", output[0]);
    expect(findings[0]).toHaveProperty("metadata.output.1", output[1]);
  });

  it("should return findings only if calls fits with filterByArguments condition", async () => {
    const functionDefinition = "function myMethod(uint256 myNumber, string myString)";

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterByArguments = ({ myString }: ethers.utils.Result): boolean => {
      return myString === "Hello!";
    };

    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: [functionDefinition],
      from,
      to,
      filterByArguments,
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const args1 = ["2345675643", "Hello!"];
    const txEvent1 = new TestTransactionEvent().addTraces({
      function: functionDefinition,
      from,
      to,
      arguments: args1,
    });

    const findings1: Finding[] = await handleTransaction(txEvent1);
    expect(findings1).toStrictEqual([generalTestFindingGenerator(txEvent1)]);

    const args2 = ["2345675643", "Goodbye!"];
    const txEvent2 = new TestTransactionEvent().addTraces({
      function: functionDefinition,
      from,
      to,
      arguments: args2,
    });

    const findings2: Finding[] = await handleTransaction(txEvent2);
    expect(findings2).toStrictEqual([]);
  });

  it("should return findings only if calls fits with filterByArguments condition, specifying function with fragment", async () => {
    const functionDefinition = "function myMethod(uint256 myNumber, string myString)";

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterByArguments = ({ myString }: ethers.utils.Result): boolean => {
      return myString === "Hello!";
    };

    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: [ethers.utils.Fragment.from(functionDefinition).format("full")],
      from,
      to,
      filterByArguments,
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const args1 = ["2345675643", "Hello!"];
    const txEvent1 = new TestTransactionEvent().addTraces({
      function: functionDefinition,
      from,
      to,
      arguments: args1,
    });

    const findings1: Finding[] = await handleTransaction(txEvent1);
    expect(findings1).toStrictEqual([generalTestFindingGenerator(txEvent1)]);

    const args2 = ["2345675643", "Goodbye!"];
    const txEvent2 = new TestTransactionEvent().addTraces({
      function: functionDefinition,
      from,
      to,
      arguments: args2,
    });

    const findings2: Finding[] = await handleTransaction(txEvent2);
    expect(findings2).toStrictEqual([]);
  });

  it("should return empty finding if other function is called", async () => {
    const functionDefinition = "function otherMethod()";

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterByArguments = (args: ethers.utils.Result): boolean => {
      return args[1] === "Hello!";
    };

    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: ["function myMethod(uint256,string)"],
      to,
      from,
      filterByArguments,
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent = new TestTransactionEvent().addTraces({
      function: functionDefinition,
      from,
      to,
    });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return findings only if calls fits with filterByOutput condition", async () => {
    const functionDefinition = "function myMethodWithOutput() returns (uint256 value)";

    const filterByOutput = (output: ethers.utils.Result): boolean => {
      return output && output.value.gte(3);
    };

    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: [functionDefinition],
      filterByOutput,
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { function: functionDefinition, output: [2] },
      { function: functionDefinition, output: [3] },
      { function: functionDefinition, output: [1] },
      { function: functionDefinition, output: [10] }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });

  it("should return findings only if calls fits with filter condition", async () => {
    const functionDefinition = "function myMethodWithOutput() returns (uint256 value)";

    const filter = (call: TraceCalls.Metadata): boolean => {
      return call.output ? call.output[0].lte(3) : false;
    };

    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: [functionDefinition],
      filter,
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { function: functionDefinition, output: [2] },
      { function: functionDefinition, output: [3] },
      { function: functionDefinition, output: [1] },
      { function: functionDefinition, output: [10] }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      generalTestFindingGenerator(),
      generalTestFindingGenerator(),
      generalTestFindingGenerator(),
    ]);
  });

  it("should filter by selector if other options are undefined", async () => {
    const functionDefinition = "function myMethodWithOutput() returns (uint256 value)";

    const traceCalls = new TraceCalls({
      onFinding: generalTestFindingGenerator,
      signatures: [functionDefinition],
    });

    handleTransaction = traceCalls.getHandleTransaction();

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { function: functionDefinition, output: [0] },
      { function: "function wrongSelector()" }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });
});
