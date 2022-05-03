import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent, generalTestFindingGenerator } from "../test";
import { createAddress } from "../utils";
import provideFunctionCallsDetectorHandler from "./function.calls";

describe("Function calls detector Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if the expected function wasn't called", async () => {
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "function func()");

    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Should not break if no trace is passed", async () => {
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "function func()", {
      to: createAddress("0x0"),
    });

    const txEvent: TransactionEvent = {
      addresses: { "0x": true },
    } as any;
    let findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a findings only if the function is called in the contract target `to`", async () => {
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "function func()", {
      to: createAddress("0x0"),
    });

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

  it("should return a findings only if the function is called from the caller target `from`", async () => {
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "function func()", {
      from: createAddress("0x0"),
    });

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
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "function func()", {
      from: createAddress("0x1"),
      to: createAddress("0x2"),
    });

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

  it("Should pass correct metadata to findingGenerator", async () => {
    const findingGenerator = (metadata?: Record<string, any>): Finding => {
      return Finding.fromObject({
        name: "Test Name",
        description: "Test Description",
        alertId: "Test Id",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          from: metadata?.from,
          to: metadata?.to,
          selector: metadata?.selector,
          arguments: metadata?.arguments,
          output: metadata?.output,
        },
      });
    };
    const functionDefinition = "function myMethod(uint256 myNumber, string myString) returns (uint256, address)";

    const args = ["0x2345675643", "Hello!"];
    const to = createAddress("0x1");
    const from = createAddress("0x2");
    const output = ["0x20", createAddress("0x1")];

    handleTransaction = provideFunctionCallsDetectorHandler(findingGenerator, functionDefinition, { to, from });

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

  it("should return findings only if calls fits with filterOnArguments condition", async () => {
    const functionDefinition = "function myMethod(uint256 myNumber, string myString)";

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterOnArguments = ({ myString }: ethers.utils.Result): boolean => {
      return myString === "Hello!";
    };

    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, functionDefinition, {
      from,
      to,
      filterOnArguments,
    });

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

  it("should return findings only if calls fits with filterOnArguments condition, specifying function with fragment", async () => {
    const functionDefinition = "function myMethod(uint256 myNumber, string myString)";

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterOnArguments = ({ myString }: ethers.utils.Result): boolean => {
      return myString === "Hello!";
    };

    handleTransaction = provideFunctionCallsDetectorHandler(
      generalTestFindingGenerator,
      new ethers.utils.Interface([functionDefinition]).getFunction("myMethod"),
      {
        from,
        to,
        filterOnArguments,
      }
    );

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
    const filterOnArguments = (args: ethers.utils.Result): boolean => {
      return args[1] === "Hello!";
    };

    handleTransaction = provideFunctionCallsDetectorHandler(
      generalTestFindingGenerator,
      "function myMethod(uint256,string)",
      {
        to,
        from,
        filterOnArguments,
      }
    );

    const txEvent = new TestTransactionEvent().addTraces({
      function: functionDefinition,
      from,
      to,
    });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return findings only if calls fits with filterOnOutput condition", async () => {
    const functionDefinition = "function myMethodWithOutput() returns (uint256 value)";

    const filterOnOutput = (output?: ethers.utils.Result): boolean => {
      return output && output.value.gte(3);
    };

    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, functionDefinition, {
      filterOnOutput,
    });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { function: functionDefinition, output: [2] },
      { function: functionDefinition, output: [3] },
      { function: functionDefinition, output: [1] },
      { function: functionDefinition, output: [10] }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });

  it("should filter by selector if options are undefined", async () => {
    const functionDefinition = "function myMethodWithOutput() returns (uint256 value)";

    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, functionDefinition);

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { function: functionDefinition, output: [0] },
      { function: "function wrongSelector()" }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator()]);
  });
});
