import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent, createAddress, generalTestFindingGenerator } from "./tests.utils";
import provideFunctionCallsDetectorHandler from "./function.calls";
import { AbiItem } from "web3-utils";
import { encodeFunctionSignature, encodeFunctionCall, encodeParameters, decodeParameter } from "./utils";
import BigNumber from "bignumber.js";

describe("Function calls detector Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("Should returns empty findings if the expected function wasn't called", async () => {
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "Func()");

    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Should not break if no trace is passed", async () => {
    const signature: string = "Func()";
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, signature, {
      to: createAddress("0x0"),
    });

    const txEvent: TransactionEvent = {
      addresses: { "0x": true },
    } as any;
    let findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should returns a findings only if the function is called in the contract target `to`", async () => {
    const signature: string = "Func()";
    const selector: string = encodeFunctionSignature(signature);
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, signature, {
      to: createAddress("0x0"),
    });

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      to: createAddress("0x1"),
      input: selector,
    });

    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({
      to: createAddress("0x0"),
      input: selector,
    });

    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("Should returns a findings only if the function is called from the caller target `from`", async () => {
    const signature: string = "Func()";
    const selector: string = encodeFunctionSignature(signature);
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, signature, {
      from: createAddress("0x0"),
    });

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x1"),
      input: selector,
    });
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x0"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("Should returns a finding only if all the conditions are met", async () => {
    const signature: string = "Func()";
    const selector: string = encodeFunctionSignature(signature);
    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, signature, {
      from: createAddress("0x1"),
      to: createAddress("0x2"),
    });

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x0"),
      to: createAddress("0x2"),
      input: selector,
    });
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x1"),
      to: createAddress("0x0"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([]);

    const txEvent3: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x0"),
      to: createAddress("0x3"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent3));
    expect(findings).toStrictEqual([]);

    const txEvent4: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x1"),
      to: createAddress("0x2"),
      input: selector,
    });
    findings = findings.concat(await handleTransaction(txEvent4));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent4)]);
  });

  it("Should pass correct metadata to findingGenerator", async () => {
    const findingGenerator = (metadata: { [key: string]: any } | undefined): Finding => {
      return Finding.fromObject({
        name: "Test Name",
        description: "Test Description",
        alertId: "Test Id",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          from: metadata?.from,
          to: metadata?.to,
          functionSelector: metadata?.functionSelector,
          arguments: metadata?.arguments,
          output: metadata?.output,
        },
      });
    };
    const functionDefinition: AbiItem = {
      name: "myMethod",
      type: "function",
      inputs: [
        {
          type: "uint256",
          name: "myNumber",
        },
        {
          type: "string",
          name: "myString",
        },
      ],
    } as AbiItem;

    const input: string = encodeFunctionCall(functionDefinition, ["2345675643", "Hello!"]);
    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const output: string = encodeParameters(["uint256", "address"], [20, createAddress("0x1")]);

    handleTransaction = provideFunctionCallsDetectorHandler(findingGenerator, functionDefinition, { to, from });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({ to, from, input, output });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toHaveProperty("metadata.from", from);
    expect(findings[0]).toHaveProperty("metadata.to", to);
    expect(findings[0]).toHaveProperty("metadata.functionSelector", encodeFunctionSignature(functionDefinition));
    expect(findings[0]).toHaveProperty("metadata.arguments.0", "2345675643");
    expect(findings[0]).toHaveProperty("metadata.arguments.1", "Hello!");
    expect(findings[0]).toHaveProperty("metadata.output", output);
  });

  it("should returns findings only if calls fits with filterOnArguments condition", async () => {
    const functionDefinition: AbiItem = {
      name: "myMethod",
      type: "function",
      inputs: [
        {
          type: "uint256",
          name: "myNumber",
        },
        {
          type: "string",
          name: "myString",
        },
      ],
    } as AbiItem;

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterOnArguments = ({ myString }: { [key: string]: any }): boolean => {
      return myString === "Hello!";
    };

    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, functionDefinition, {
      to,
      from,
      filterOnArguments,
    });

    const input1: string = encodeFunctionCall(functionDefinition, ["2345675643", "Hello!"]);
    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({ to, from, input: input1 });

    const findings1: Finding[] = await handleTransaction(txEvent1);
    expect(findings1).toStrictEqual([generalTestFindingGenerator(txEvent1)]);

    const input2: string = encodeFunctionCall(functionDefinition, ["2345675643", "Goodbye!"]);
    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({ to, from, input: input2 });

    const findings2: Finding[] = await handleTransaction(txEvent2);
    expect(findings2).toStrictEqual([]);
  });

  it("should returns findings only if calls fits with filterOnArguments condition, speciying function with signature", async () => {
    const functionDefinition: AbiItem = {
      name: "myMethod",
      type: "function",
      inputs: [
        {
          type: "uint256",
          name: "myNumber",
        },
        {
          type: "string",
          name: "myString",
        },
      ],
    } as AbiItem;

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterOnArguments = (args: { [key: string]: any }): boolean => {
      return args[1] === "Hello!";
    };

    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "myMethod(uint256,string)", {
      to,
      from,
      filterOnArguments,
    });

    const input1: string = encodeFunctionCall(functionDefinition, ["2345675643", "Hello!"]);
    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({ to, from, input: input1 });

    const findings1: Finding[] = await handleTransaction(txEvent1);
    expect(findings1).toStrictEqual([generalTestFindingGenerator(txEvent1)]);

    const input2: string = encodeFunctionCall(functionDefinition, ["2345675643", "Goodbye!"]);
    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({ to, from, input: input2 });

    const findings2: Finding[] = await handleTransaction(txEvent2);
    expect(findings2).toStrictEqual([]);
  });

  it("should return empty finding if other function is called", async () => {
    const functionDefinition: AbiItem = {
      name: "otherMethod",
      type: "function",
      inputs: [],
    } as AbiItem;

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    const filterOnArguments = (args: { [key: string]: any }): boolean => {
      return args[1] === "Hello!";
    };

    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, "myMethod(uint256,string)", {
      to,
      from,
      filterOnArguments,
    });

    const input: string = encodeFunctionCall(functionDefinition, []);
    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({ to, from, input: input });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should returns findings only if calls fits with filterOnOutput condition", async () => {
    const functionDefinition: AbiItem = {
      name: "myMethodWithOutput",
      type: "function",
      inputs: [],
      outputs: [
        {
          name: "value",
          type: "uint256",
        },
      ],
    };

    const filterOnOutput = (output: string): boolean =>
      new BigNumber(3).lte(new BigNumber(decodeParameter("uint256", output)));

    handleTransaction = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, functionDefinition, {
      filterOnOutput,
    });

    const input: string = encodeFunctionCall(functionDefinition, []);
    const encoder = (x: number) => encodeParameters(functionDefinition.outputs as any, [x]);
    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      { output: encoder(2), input },
      { output: encoder(3), input },
      { output: encoder(1), input },
      { output: encoder(10), input }
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([generalTestFindingGenerator(), generalTestFindingGenerator()]);
  });
});
