import { Finding, FindingSeverity, FindingType, HandleTransaction, TraceAction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent, createAddress, generalTestFindingGenerator } from "./tests.utils";
import provideFunctionCallsDetectorHandler from "./function.calls";
import { AbiItem } from "web3-utils";
import { encodeFunctionSignature, encodeFunctionCall, abiDecode } from "./utils";
import { decodeFunctionCallParameters } from ".";

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
          input: metadata?.input,
        },
      });
    };
    const signature: AbiItem = {
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
    const input: string = encodeFunctionCall(signature, ["2345675643", "Hello!%"]);

    const to: string = createAddress("0x1");
    const from: string = createAddress("0x2");
    handleTransaction = provideFunctionCallsDetectorHandler(findingGenerator, signature, { to, from });

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({ to, from, input });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([findingGenerator({ to, from, input })]);
  });

  it("Should be able to handle additional filter function passed inside functionCallGenerator", async () => {
    const abiItem = {
      name: "myMethod",
      type: "function",
      inputs: [
        {
          type: "uint256",
          name: "myNumber",
        },
        {
          type: "uint256",
          name: "myNumber",
        },
      ],
    } as AbiItem;

    const filterFn = (value: TraceAction): boolean => {
      const input = value.input;
      const result = decodeFunctionCallParameters(["uint256", "uint256"], input);
      if (result["0"] === "1000" && result["1"] === "100") return false;
      else return true;
    };

    const input = encodeFunctionCall(abiItem, ["1000", "100"]);

    const inputForFailingCase = encodeFunctionCall(abiItem, ["100", "100"]);

    const functionCallDetector = provideFunctionCallsDetectorHandler(generalTestFindingGenerator, abiItem, {
      filter: filterFn,
    });

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x0"),
      to: createAddress("0x2"),
      input: input,
    });

    const agentcall1 = await functionCallDetector(txEvent1);

    expect(agentcall1).toStrictEqual([]);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x0"),
      to: createAddress("0x2"),
      input: inputForFailingCase,
    });

    const agentCall2 = await functionCallDetector(txEvent2);

    expect(agentCall2).toStrictEqual([generalTestFindingGenerator()]);
  });
});
