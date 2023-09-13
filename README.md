# General Agent Module

## Description

This module contains some common approaches for building Forta Bots. You will also find some tools for writing tests for these bots. These approaches can be composed for creating more complex bots or used only for checking without returning their findings.

## Installation

- Using npm: `npm i forta-agent-tools`

or

- Clone the repo
- npm install
- npm run test

## Handlers

Handlers are approaches for dealing with block and transaction events. They can either be integrated into a bot's logic
to make it easier to get specific data based on transactions or blocks or used like Forta bot generators through.

Each handler gets specific data, which is called metadata (related to what would be relevant for the alert metadata),
from a transaction or block event. This data can be returned to be processed externally by calling
`handler.metadata(event)`, but the handler can also receive a callback that creates a finding from its metadata. In
this case, it can both return findings through `handler.handle(event)` and also generate the Forta bot handlers through
`handler.getHandleBlock()` and `handler.getHandleTransaction()`.

`Handler` is an abstract base class and each specific handler extends it. The common interface is:

- `Handler(options)`: Each handler has a specific set of options. The only common field between all the specific
  options is the optional `onFinding`, that defines how a finding will be generated based on the metadata. `Handler`, in this case, is a specific handler, not the `Handler` base class.
- `metadata(event)`: This method returns a promise to an array of metadata objects related to a transaction or block
  or, if there's no implementation for a specific event (e.g. a handler only gets information from transactions, not
  blocks) it will return a promise that resolves to `null`.
- `handle(event, onFinding?)`: This method handles a transaction or block event and returns a list of findings. `onFinding` will override `options.onFinding` if both were specified.
- `getHandleBlock(onFinding?)`: This method returns a `forta-agent` `HandleBlock` handle callback. `onFinding` will override `options.onFinding` if both were specified.
- `getHandleTransaction(onFinding?)`: This method returns a `forta-agent` `HandleTransaction` handle callback. `onFinding` will override `options.onFinding` if both were specified.

Each handler's options and metadata interfaces can be accessed through `Handler.Options` and `Handler.Metadata`
(`Handler`, again, in this case, being a specific handler, not the `Handler` base class).

### BlacklistedAddresses

This handler detects transactions that contain addresses from a list provided by the user.

#### How to use it

```ts
import { Finding, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { handlers, createAddress } from "forta-agent-tools";

const blacklistedAddressesHandler = new handlers.BlacklistedAddresses({
  addresses: [createAddress("0x0")],
  onFinding(metadata) {
    return Finding.from({
      name: "Blacklisted Address",
      description: "A transaction involving a blacklisted address was found",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {},
      addresses: metadata.addresses,
    });
  },
});

const handleTransaction = blacklistedAddressesHandler.getHandleTransaction();
const handleBlock = blacklistedAddressesHandler.getHandleBlock();

// or

async function handleTransaction(txEvent: TransactionEvent): Promise<Finding[]> {
  const findings = await blacklistedAddressesHandler.handle(txEvent);

  // or

  const metadataList = await blacklistedAddressesHandler.metadata(txEvent);
  const findingsFromMetadata = (metadataList || []).map((metadata) => {
    return Finding.from({
      name: "Blacklisted Address",
      description: "A transaction involving a blacklisted address was found",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {},
      addresses: metadata.addresses,
    });
  });

  // ...
}
```

#### Options

- `addresses`: Blacklisted addresses. A finding should be generated if any of them is involved in a transaction.

#### Metadata

- `addresses`: Blacklisted addresses that were involved in a transaction.

### Erc20Transfers

This handler detects ERC20 token transfers in transactions.

#### How to use it

```ts
import { Finding, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { handlers, createAddress } from "forta-agent-tools";

const erc20TransfersHandler = new handlers.Erc20Transfers({
  emitter: createAddress("0x0"),
  from: createAddress("0x1"),
  to: createAddress("0x2"),
  amountThreshold: "10000", // or (amount) => amount.gte("100")
  onFinding(metadata) {
    return Finding.from({
      name: "Large ERC20 transfer",
      description: "A large ERC20 transfer was detected",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        from: metadata.from,
        to: metadata.to,
        amount: metadata.amount.toString(),
      },
    });
  },
});

const handleTransaction = erc20TransfersHandler.getHandleTransaction();
const handleBlock = erc20TransfersHandler.getHandleBlock();

// or

async function handleTransaction(txEvent: TransactionEvent): Promise<Finding[]> {
  const findings = await erc20TransfersHandler.handle(txEvent);

  // or

  const metadataList = await erc20TransfersHandler.metadata(txEvent);
  const findingsFromMetadata = (metadataList || []).map((metadata) => {
    return Finding.from({
      name: "Large ERC20 transfer",
      description: "A large ERC20 transfer was detected",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        token: metadata.emitter,
        from: metadata.from,
        to: metadata.to,
        amount: metadata.amount.toString(),
      },
    });
  });

  // ...
}
```

#### Options

- `emitter`: Token address, emitter of the `Transfer` events that will be listened.
- `from`: Transfer sender.
- `to`: Transfer receiver.
- `amountThreshold`: Determines a filter based on the transfer amount. Can be either a value, like `"1000"` (doesn't
  consider the token's decimal places, same `uint256` representation as in the contract), case in which the transfer
  event will be filtered out when it amount less than that value, or a callback that defines whether the amount should lead to
  a finding or not.

#### Metadata

- `emitter`: Token address.
- `from`: Transfer sender.
- `to`: Transfer receiver.
- `amount`: Transfer amount.

### EthTransfers

This handler detects ether transfers in transactions.

#### How to use it

```ts
import { Finding, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { handlers, createAddress } from "forta-agent-tools";

const ethTransfersHandler = new handlers.EthTransfers({
  from: createAddress("0x0"),
  to: createAddress("0x1"),
  valueThreshold: "10000", // or (value) => value.gte("100")
  onFinding(metadata) {
    return Finding.from({
      name: "Large ether transfer",
      description: "A large ether transfer was detected",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        from: metadata.from,
        to: metadata.to,
        value: metadata.value.toString(),
      },
    });
  },
});

const handleTransaction = ethTransfersHandler.getHandleTransaction();
const handleBlock = ethTransfersHandler.getHandleBlock();

// or

async function handleTransaction(txEvent: TransactionEvent): Promise<Finding[]> {
  const findings = await ethTransfersHandler.handle(txEvent);

  // or

  const metadataList = await ethTransfersHandler.metadata(txEvent);
  const findingsFromMetadata = (metadataList || []).map((metadata) => {
    return Finding.from({
      name: "Large ether transfer",
      description: "A large ether transfer was detected",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        from: metadata.from,
        to: metadata.to,
        value: metadata.value.toString(),
      },
    });
  });

  // ...
}
```

#### Options

- `from`: Transfer sender.
- `to`: Transfer receiver.
- `valueThreshold`: Determines a filter based on the transfer amount. Can be either a value, like `"1000"` (in wei),
  case in which the transfer event will be filtered out when it amount less than that value, or a callback that defines
  whether the amount should lead to a finding or not.

#### Metadata

- `from`: Transfer sender.
- `to`: Transfer receiver.
- `value`: Transferred value in wei.

### TraceCalls

This handler parses and detects specific calls in transactions traces.

#### How to use it

```ts
import { Finding, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { handlers, createAddress } from "forta-agent-tools";

const traceCallsHandler = new handlers.TraceCalls({
  signatures: ["function func(uint256 param) returns (uint256 resp)"],
  from: createAddress("0x0"),
  to: createAddress("0x1"),
  includeErrors: false,
  filterByArguments(args) {
    return args.param.eq(0);
  },
  filterByOutput(output) {
    return output.resp.eq(1);
  },
  filter(metadata) {
    return metadata.trace.traceAddress.length === 1;
  },
  onFinding(metadata) {
    return Finding.from({
      name: "Func called in traces",
      description: "A func call was detected in the transaction's traces",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        from: metadata.from,
        to: metadata.to,
        error: metadata.error,
        param: metadata.args.param.toString(),
        resp: metadata.output.resp.toString(),
      },
    });
  },
});

const handleTransaction = traceCallsHandler.getHandleTransaction();
const handleBlock = traceCallsHandler.getHandleBlock();

// or

async function handleTransaction(txEvent: TransactionEvent): Promise<Finding[]> {
  const findings = await traceCallsHandler.handle(txEvent);

  // or

  const metadataList = await traceCallsHandler.metadata(txEvent);
  const findingsFromMetadata = (metadataList || []).map((metadata) => {
    return Finding.from({
      name: "Func called in traces",
      description: "A func call was detected in the transaction's traces",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        from: metadata.from,
        to: metadata.to,
        error: metadata.error,
        param: metadata.args.param.toString(),
        resp: metadata.output.resp.toString(),
      },
    });
  });

  // ...
}
```

#### Options

- `signatures`: Function signatures to be monitored. Also used in decoding.
- `from`: Call sender.
- `to`: Call receiver.
- `includeErrors`: Whether calls that had an error should be included or not (by default, falsy).
- `filterByArguments`: Callback (same signature as a `array.filter(cb)` callback) to filter calls by arguments.
- `filterByOutput`: Callback (same signature as a `array.filter(cb)` callback) to filter calls by returned values.
- `filter`: Callback (same signature as a `array.filter(cb)` callback) to filter calls by metadata.

#### Metadata

- `from`: Call sender.
- `to`: Call receiver.
- `trace`: Trace object.
- `error`: Whether there was an error during the call or not.
- `output`: Call result. Will be `null` if `error` is `true`.

As well as `ethers.utils.TransactionDescription`'s fields:

- `functionFragment`: Function fragment from the signature.
- `name`: Function name.
- `args`: Function arguments.
- `signature`: Function signature.
- `sighash`: Function sighash.
- `value`: Transaction value in wei.

## Utils

### Address Handling

These are utility functions to create and manipulate addresses.

- `padAddress(address)`: Simply pads left a hex string with zeroes so it fits the expected length.
- `createAddress(address)`: Pads the provided address and ensures it is lowercase.
- `createChecksumAddress(address)`: Pads the provided address and ensures it is in checksum format.
- `toChecksumAddress(address)`: Formats a valid address (case-insensitive) in checksum format.

### TestTransactionEvent

This is a helper class for creating `TransactionEvents` using the fluent interface pattern.

#### How to use it

```ts
import { TestTransactionEvent } from "forta-agent-tools/lib/test";

const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(address1).setTo(address2);
```

There are multiple methods you can use for creating the exact `TransactionEvent` you want:

- `setFrom(address)` This method sets the `transaction.from` field in the event.
- `setTo(address)` This method sets the `transaction.to` field in the event.
- `setGas(value)` This method sets the `transaction.gas` field in the event.
- `setGasPrice(value)` This method sets the `transaction.gasPrice` field in the event.
- `setValue(value)` This method sets the `transaction.value` field in the event.
- `setData(data)` This method sets the `transaction.data` field in the event.
- `setGasUsed(value)` This method sets the `receipt.gasUsed` field in the event.
- `setTimestamp(timestamp)` This method sets the `block.timestamp` field in the event.
- `setBlock(block)` This method sets the `block.number` field in the event.
- `addEventLog(eventSignature, address, inputs)` This method adds a log to the `receipt.logs` field. The only mandatory argument is the `eventSignature`. `address` argument is the zero address by default, `inputs` corresponds to the event arguments values, it is an empty list by default.
  > The `keccak256` hash of the signature is added at the beginning of the `topics` list automatically.
- `addInvolvedAddresses(addresses)` This method adds a spread list of addresses to `addresses` field.
- `addTraces(traceProps)` This method adds a list of `Trace` objects at the end of `traces` field in the event. The traces are created from the `traceProps` spread list.
  > `TraceProps` is a TS object with the following optional fields `{ function, to, from, arguments, output, value, traceAddress }`.

### TestBlockEvent

This is a helper class for creating `BlockEvents` using the fluent interface pattern.

#### How to use it

```ts
import { TestBlockEvent } from "forta-agent-tools/lib/test";

const blockEvent: BlockEvent = new TestBlockEvent().setHash(blockHash).setNumber(blockNumber);
```

There are multiple methods you can use for creating the exact `BlockEvent` you want:

- `setHash(blockHash)` This method sets the `block.hash` field in the event.
- `setParentHash(blockHash)` This method sets the `block.parentHash` field in the event.
- `setNumber(blockNumber)` This method sets the `block.number` field in the event.
- `addTransactions(txns)` This method adds the hashes of a spread list of transaction events at the end of `block.transactions` field in the event.
- `addTransactionsHashes(hashes)` This method adds a hashes spread list to the end of `block.transactions` field in the event.

### TestAlertEvent

The concept of a ` TestAlertEvent` class does not actually exist. It was not implemented because the `forta-agent`library provides built-in static methods that serve the purpose that`TestAlertEvent` would have fulfilled.

#### Creating Alert

In the `forta-agent` SDK, you'll find a class called `Alert`, which essentially represents an `Alert` within the context of the `AlertEvent` in Forta.

- You cannot directly instantiate an `Alert` object through its constructor because it has a private constructor. Instead, there's a static method named `fromObject`.
- To use it, call `Alert.fromObject(alertInput: AlertInput)`, where `AlertInput` is an interface containing all the properties an `Alert` can have. Each property in `AlertInput` is optional, allowing you to create an `Alert` with only the properties you need for your use case or testing.
- For more details about `Alert` and its properties, refer to the official [forta-docs](https://docs.forta.network/en/latest/sdk/#alert).

#### Creating AlertEvent

`AlertEvent` is a class with a constructor that takes a single argument of type `Alert`.

- You can use the `Alert` object created using the above method to obtain an `AlertEvent` object.
- All other properties in `AlertEvent` are simply getters, serving as aliases to the property methods of the `Alert` class.
- To learn more about `AlertEvent` and its properties, consult the official [forta-docs](https://docs.forta.network/en/latest/sdk/#alertevent).

To create an `Alert` object, utilize the static method `Alert.fromObject(alertInput: AlertInput)`, and then proceed to create an `AlertEvent`. Refer to the code snippet below for an example.

#### How to Use it

```ts
import { Alert, AlertEvent, EntityType, Label } from "forta-agent";
import { AlertInput } from "../utils/alert.type";
import { createAddress, createTransactionHash } from "../utils";

let alert: Alert;
let alertEvent: AlertEvent;
let alertInput: AlertInput;

const createAlert = (alertInput: AlertInput): Alert => {
  return Alert.fromObject(alertInput);
};

const getLabel = (name: string, value: string): Label => {
  return Label.fromObject({
    entityType: EntityType.Transaction,
    entity: createTransactionHash({ to: createAddress("0x1234") }),
    label: name,
    confidence: 1,
    metadata: { value: value },
  });
};

const getAlertInput = (): AlertInput => {
  let alertInput: AlertInput = {
    addresses: [createAddress("0x1234"), createAddress("0x5678"), createAddress("0x9abc")],
    alertId: createTransactionHash({ to: createAddress("0x1234") }),
    hash: createTransactionHash({ to: createAddress("0x45678987654") }),
    contracts: [
      { address: createAddress("0x1234"), name: "Contract1" },
      { address: createAddress("0x5678"), name: "Contract2" },
      { address: createAddress("0x9abc"), name: "Contract3" },
    ],
    createdAt: "2021-01-01T00:00:00.000Z",
    description: "Test Alert",
    findingType: "Info",
    name: "Test Alert",
    protocol: "Test",
    scanNodeCount: 1,
    severity: "Info",
    alertDocumentType: "Alert",
    relatedAlerts: [createTransactionHash({ to: createAddress("0x1234") })],
    chainId: 1,
    labels: [getLabel("label1", "value1"), getLabel("label2", "value2")],
    source: {
      transactionHash: createTransactionHash({ to: createAddress("0x1234") }),
      block: {
        timestamp: "2021-01-01T00:00:00.000Z",
        chainId: 1,
        hash: createTransactionHash({ to: createAddress("0x1234") }),
        number: 1,
      },
      bot: {
        id: "botId",
        reference: "botReference",
        image: "botImage",
      },
      sourceAlert: {
        hash: createTransactionHash({ to: createAddress("0x1234") }),
        botId: "botId",
        timestamp: "2021-01-01T00:00:00.000Z",
        chainId: 1,
      },
    },
    metadata: {
      metadata1: "value1",
      metadata2: "value2",
    },
    projects: [
      {
        id: "projectId",
        name: "projectName",
        contacts: {
          securityEmailAddress: "securityEmailAddress",
          generalEmailAddress: "generalEmailAddress",
        },
        website: "website",
        token: {
          symbol: "symbol",
          name: "name",
          decimals: 1,
          chainId: 1,
          address: createAddress("0x1234"),
        },
        social: {
          twitter: "twitter",
          github: "github",
          everest: "everest",
          coingecko: "coingecko",
        },
      },
    ],
    addressBloomFilter: {
      bitset: "bitset",
      k: "k",
      m: "m",
    },
  };

  return alertInput;
};

alertInput = getAlertInput();
alert = createAlert(alertInput);
alertEvent = new AlertEvent(alert);
```

### runBlock

This is a helper function to simulate the execution of `run block` cli command when the bot has implemented a `handleTransaction` and a `handleBlock`.

#### How to use it

```ts
import { runBlock } from "forta-agent-tools/lib/test";

async myFunction(params) => {
  ...
  const findings: Findings[] = await runBlock(bot, block, tx1, tx2, tx3, ..., txN);
  ...
};
```

Parameters description:

- `bot`: It is a JS object with two properties, `handleTransaction` and `handleBlock`.
- `block`: It is the `BlockEvent` that the bot will handle.
- `tx#`: These are the `TransactionEvent` objects asociated with the `BlockEvent` that the bot will handle.

### MockTransactionData

This is a helper class for mocking the interfaces `ethers.providers.TransactionResponse` and `ethers.providers.TransactionReceipt` by implementing them.
Since this class implements both of these interfaces, the instance of this class can be used for ethers `TransactionResponse` and `TransactionReceipt`.

The class is instantiated with default values for all the fields and has set functions to set the values for each of these fields.

Basic Usage:

```ts
import { MockTransactionData } from "forta-agent-tools/lib/test";
import { utils, BigNumber, providers } from "ethers";

const mockTransactionData: MockTransactionData = new MockTransactionData();
mockTransactionData.setValue(utils.parseEther("1.0"))
.setGasPrice(BigNumber.from(1000000))
.setGasLimit(BigNumber.from(21000))

mockTransactionData.setHash("0x1234567890987654345678987654...");
// or can generate the hash based on the current transaction config
mockTransactionData.generateHash();

const transactionResponse: Partial<providers.TransactionResponse> = {   // Add the fields that you want to set for the TransactionResponse.
  hash: '0x3fda39a81c47dc37d84c761c3cbbea375866c1fbdfcf91566eaa4c4ef62c70ad',
  type: 2,
  accessList: [],
  blockHash: '0x25e44bfb2c3a47703c86884110a6d5c5a7a655b02fe1ca3a9d135e7459efab95',
  blockNumber: 18095175,
  transactionIndex: 109,
  confirmations: 22,
  from: '0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5',
  gasPrice: BigNumber.from("9999762606"),
  maxPriorityFeePerGas: BigNumber.from("0"),
  maxFeePerGas: BigNumber.from("9999762606"),
  gasLimit: BigNumber.from(0x5208),
  to: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263',
  value: BigNumber.from("63002772804144528"),
  nonce: 436110,
  data: '0x',
  r: '0xa62a979dd4713a8c12de05167f68ddbfab947886d44eb0806f9b4f8c0b7d4ca5',
  s: '0x72058708dfe24365969eff435447a92cd9ee0348e898b5ea1d26211f77241a6d',
  v: 1,
  creates: null,
  chainId: 1
}

mockTransaction.setTransactionResponse(transactionResponse)  // if hash is not set, the hash will be generated.

const transactionReceipt: Partial<providers.TransactionReceipt> = { // Add the fields that you want to set for the TransactionReceipt.
  to: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263',
  from: '0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5',
  contractAddress: null,
  transactionIndex: 109,
  gasUsed: BigNumber.from(21000),
  logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  blockHash: '0x25e44bfb2c3a47703c86884110a6d5c5a7a655b02fe1ca3a9d135e7459efab95',
  transactionHash: '0x3fda39a81c47dc37d84c761c3cbbea375866c1fbdfcf91566eaa4c4ef62c70ad',
  logs: [],
  blockNumber: 18095175,
  confirmations: 33,
  cumulativeGasUsed: BigNumber.from(12276572),
  effectiveGasPrice: BigNumber.from("9999762606"),
  status: 1,
  type: 2,
  byzantium: true
}

mockTransaction.setTransactionReceipt(transactionReceipt) // if hash is not set, the hash will be generated.

...

```

In this way the class can be used to shape the `MockTransactionData` into `ethers.providers.TransactionResponse` or/and `ethers.providers.TransactionReceipt`.

You can get only the `TransactionResponse` or `TransactionReceipt` by the calling the methods:

```ts
...

const txResponse: providers.TransactionResponse = mockTransactionData.getTransactionResponse();

const txReceipt: providers.TransactionReceipt = mockTransactionData.getTransactionReceipt();

```

All of the set methods in the `MockTransactionData` will return the type `MockTransactionData`. So these set methods can be chained.
Some of the methods that the MockTransactionData provides to set the transaction field values:

- `setHash(hash: string)`: The method accepts a string and sets it as the txn hash for the `MockTransactionData`.
- `generateHash()`: The method generates the txn hash based on the current `MockTransactionData` config and sets it as the txn hash.
- `setFrom(address: string)`: Sets the from Address
- `setTo(address: string)`: Sets the to Address
- `setNonce(value: number)`: Sets the Nonce.
- `setContractAddress(address: string)`: Sets the contract Address field of the transaction.
- `setGasPrice(value: string)`: Sets the Gas price for the `MockTransactionData`
- `setGasLimit(value: string)`: Sets the gas limit for the `MockTransactionData`
- `setData(data: string)`: Sets the data of the transaction.
- `setLogs(logs: ethers.providers.Log[])`: Sets the logs field in the transaction receipt field of the `MockTransactionData`
- `setLogsBloom(value: string)`: Sets the logsBloom value.
- `setTimestamp(timestamp: number)`: Sets the timestamp of the transaction.
- `setStatus`: Sets the Transaction Status.
- `setConfirmations(confirmations: number)`: Sets the number of confirmations for the transaction.
- `setTransactionResponse(transaction: Partial<ethers.providers.TransactionResponse>)`: Sets all the values for the ethers `TransactionResponse` based on the given optional/partial fields. Generates the transaction hash if not given.
- `setTransactionReceipt(receipt: Partial<ethers.providers.TransactionReceipt>)`: Sets all the values for the ethers `TransactionReceipt` based on the given optional/partial fields. Generates the transaction hash if not given.
- `setBlockHash(hash: string)`: Sets the Block hash.
- `setBlockNumber(blockNumber: number)`: Sets the block number.
- `setMaxPriorityFeePerGas(value: string)`: Sets the Max Priority fee for the transaction.
- `setMaxFeePerGas(value: string)`: Sets the Max Fee field of the transaction.
- `setTransactionType(type: number)`: Sets the value of type in the transaction. The type refers to the "Typed-Transaction features".
- `setTransactionIndex(index: number)`: Sets the "transactionIndex" field in the transaction.
- `setChainId(chainId: number)`: Sets the chainId of the transaction.
- `setGasUsed(value: string)`: Sets the gasUsed field in the transaction.
- `setCumulativeGasUsed(value: string)`: Sets the cumulativeGasUsed field in the transaction.
- `setEffectiveGasPrice(value: string)`: Sets the effectiveGasPrice field in the transaction.

### MockEthersProvider

This is a helper class for mocking the `ethers.providers.Provider` class.

Basic usage:

```ts
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { utils, Contract } from "ethers";

const iface: utils.Interface = new utils.Interface([
  "function myAwesomeFunction(uint256 param1, string param2) extenal view returns (unit8 id, uint256 val)",
]);

const address: string = createAddress("0xf00");
const data: string = createAddress("0xda7a");

const mockProvider: MockEthersProvider = new MockEthersProvider()
  .addCallTo(address, 20, iface, "myAwesomeFunction", { inputs: [10, "tests"], outputs: [1, 2000] })
  .addStorage(address, 5, 15, utils.defaultAbiCoder.encode(["address"], [data]));
```

#### How to use it

This mock provides some methods to set up the values that the provider should return:

- `addCallTo(contract, block, iface, id, { inputs, outputs })`. This method prepares a call to the `contract` address
  at the specified `block`, where `iface` is the `ethers.utils.Interface` object relative to the contract, `id` is the identifier
  of the function to call, `inputs` are the parameters passed in the call and `outputs` are the values the call
  should return.
- `addCallFrom(contract, from, block, iface, id, { inputs, outputs })`. Similar to `addCallTo` but only the `from` will be able to call
  the function.
- `addStorage(contract, slot, block, result)`. This method prepares the value stored in the specific `slot` of `contract` address
  in the given `block` to be `result`.
- `addBlock(blockNumber, block)`. This method prepares the block with number `blockNumber` to be `block`.
- `setLatestBlock(block)`. This method allows you to set up what the number of the latest block in the provider is.
- `addSigner(addr)`. This function prepares a valid signer for the given address that uses the provider being used.
- `addLogs(logs)`. This method allows you to add entries to the logs record that will be filtered in `getLogs` if the filter specified wasn't yet added in `addFilteredLogs`.
- `setNetwork(chainId, ensAddress?, name?)`. This method allows you to set up the network information (`chainId`, `ensAddress` and `name`) that will be returned when there's a call to `getNetwork`.
- `setTransaction(transaction: MockTransactionData)`: This method accepts the transaction parameter of type `MockTransactionData` and allows you to set the return value for both `ethers.providers.getTransaction(hash: string)` and `ethers.providers.getTransactionReceipt(hash: string)`
- `clear()`. This function clears all the mocked data.

All the data you set in the provider will be used until the `clear` function is called.

### MockEthersSigner

This is a helper class for mocking the `ethers.providers.JsonRpcSigner` class. This class extends `MockEthersProvider`.

Basic usage:

```ts
import { MockEthersProvider, MockEthersSigner } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { utils, Contract } from "ethers";

const iface: utils.Interface =  new utils.Interface([
  "function myAwesomeFunction(uint256 param1, string param2)"
]);

const address: string = createAddress("0xf00");
const contract: string = createAddress("0xda0");

const mockProvider: MockEthersProvider = new MockEthersProvider();
const mockSigner: MockEthersSigner = new MockEthersSigner(mockProvider)
  .setAddress(from)
  .allowTransaction(
    address, contract, iface,
    "myAwesomeFunction", [20, "twenty"]
    { confirmations: 42 }, // receipt data
  )
```

#### How to use it

This mock provides some methods to set up the values that the signer should return:

- `setAddress(address)`. This method sets the address that the signer can sign.
- `allowTransaction(from, to, iface, id, inputs)`. This method prepares a txn sent to `to` and signed from `from`. The transaction is meant to call the method `id` taken from the `iface` of the `to` contract passing the `inputs` as parameters. `receipt` will be the receipt returned by the transaction.
- `denyTransaction(from, to, iface, id, inputs, msg)`. Same conditions of `allowTransaction` but in this case the transaction will be reverted with `msg` message.

All the data you set in the signer will be used until the `clear` function is called.

### NetworkManager

This is a tool to help with storing data relative to the network the bot will be running at.

Basic usage:

```ts
import { NetworkManager } from "forta-agent-tools";

interface NetworkData {
  address: string;
  num: number;
}

const data: Record<number, NetworkData> = {
  // ChainID 1
  1: {
    address: "address1",
    num: 1,
  },
  42: {
    address: "address42",
    num: 2,
  },
};

const provider = getEthersProvider();
const networkManager = new NetworkManager(data);

await networkManager.init(provider);

networkManager.get("address"); // "address1" if the ChainID is 1, "address42" if the ChainID is 42
```

#### How to use it

- `NetworkManager(networkData, chainId?)`: Sets the network data and creates a `NetworkManager` instance. If `chainId` is specified, it won't need `NetworkManager.init()` to be initialized. Throws an error if there is no entry for `chainId` in `networkData`.
- `getNetworkMap()`: Gets the network map passed as argument in the constructor as read-only.
- `getNetwork()`: Gets the instance's active ChainID.
- `setNetwork(chainId)`: Sets the instance's active ChainID. Throws an error if there is no entry for `chainId` in `networkData`.
- `init(provider)`: Retrieves network data from the provider and sets the active ChainID. Throws an error if there is no entry for that ChainID in `networkData`.
- `get(key)`: Gets the value of the field `key` in the active network's data record. Throws an error if `NetworkManager` was not yet initialized, i.e. the ChainID was not specified in the constructor and `NetworkManager.init()` or `NetworkManager.setNetwork()` were not called.

### ProviderCache

This is a class that can create a proxy to a provider which then caches call results and avoids cached calls being repeated both later and in the same block or transaction.

Basic usage:

```ts
import { ProviderCache, createAddress } from "forta-agent-tools";
import { ethers, getEthersProvider } from "forta-agent";

const provider = getEthersProvider();
const cachedProvider = ProviderCache.createProxy(provider);

const address = createAddress("0x0");
const iface: ethers.ContractInterface = [];

// the cached provider can be used as a regular provider
const contract = new ethers.Contract(address, iface, cachedProvider);
```

#### How to use it

- `ProviderCache.createProxy(provider, cacheByBlockTag?)`: Creates a proxy to a provider that caches call results. If `cacheByBlockTag` is set to `false`, then the call is cached without taking the block tag into account, useful for cases where some data can't change between blocks. By default, `cacheByBlockTag` is set to `true`, thus the call result cache takes into account the block tag in which it's called.
- `ProviderCache.clear()`: Clears the internal cache.
- `ProviderCache.set(options)`: Sets options specified by `options`.
  - `options.blockDataCacheSize?`: If it's defined, the block data cache (used when `cacheByBlockTag` is `true`) is cleared if it exists and its max size is changed to the value specified.
  - `options.immutableDataCacheSize?`: if it's defined, the immutable data cache (used when `cacheByBlockTag` is `false`) is cleared if it exists and its max size is changed to the value specified.

### CachedContract

This is a shortcut class that extends `ethers.Contract` but uses a cached provider from `ProviderCache`. Creating a `CachedContract` by calling `new CachedContract(address, iface, provider, cacheByBlockTag?)` is equivalent to creating an `ethers.Contract` by calling `new ethers.Contract(address, iface, ProviderCache.createProxy(provider, cacheByBlockTag?))`. There's also some utility methods.

Basic usage:

```ts
import { CachedContract, createAddress } from "forta-agent-tools";
import { getEthersProvider } from "forta-agent";

const provider = getEthersProvider();
const address = createAddress("0x0");
const iface: ethers.ContractInterface = [];

const cachedContract = new CachedContract(address, iface, provider, true);

// it can also be created from an existing ethers.Contract

const contract = new ethers.Contract(address, iface, provider);
const cachedContractfromContract = CachedContract.from(contract, true);
```

#### How to use it

- `CachedContract(addressOrName, contractInterface, signerOrProvider, cacheByBlockTag?)`: Creates a new `CachedContract` instance with address `addressOrName`, interface `contractInterface` and a `ProviderCache` proxy to the provider `provider` with the specified `cacheByBlockTag` option. By default, `cacheByBlockTag` is set to `true`. Throws if `provider` type is not an extension of `ethers.providers.BaseProvider`.
- `from(contract, cacheByBlockTag?)`: Creates a new `CachedContract` instance from `contract`, an `ethers.Contract` instance by collecting its fields and calling the constructor. A wrapper to `new CachedContract(contract.address, contract.interface, contract.provider, cacheByBlockTag?)`. By default, `cacheByBlockTag` is set to `true`. Throws if `contract` has a signer.
- `clear()`: A shortcut to `ProviderCache.clear()`. Clears the `ProviderCache` global cache.

### MulticallProvider

This is an ethers provider-like interface built on top of `ethers-multicall`, but it also supports specifying a block
tag for a call, using `Multicall2` features and making grouped calls.

The calls are decoded using `ethers`, so each return data has the same structure as a call made by itself through an `ethers.Contract`.

Supported chains (by default):

- Ethereum Mainnet
- Ropsten Testnet
- Rinkeby Testnet
- Görli Testnet
- Kovan Testnet
- BNB Smart Chain
- BNB Smart Chain Testnet
- Gnosis
- Huobi ECO Chain Mainnet
- Polygon Mainnet
- Fantom Opera
- Arbitrum One
- Avalanche
- Mumbai Testnet

Other chains can also be supported by finding a deployed Multicall2 contract address and calling
`MulticallProvider.setMulticall2Addresses({ [chainId]: multicall2Address })`. Default addresses can also be overriden.

Basic usage:

```ts
import { getEthersProvider } from "forta-agent";
import { MulticallProvider, MulticallContract, createAddress } from "forta-agent-tools";

const provider = getEthersProvider();
const multicallProvider = new MulticallProvider(provider);

const token = new MulticallContract(createAddress("0x0"), [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]);

async function initialize() {
  // fetches the provider network and loads an appropriate Multicall2 address
  // throws if the network is not supported
  await multicallProvider.init();
}

async function getBalances() {
  const addresses = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];
  const calls = addresses.map((address) => token.balanceOf(address));
  const blockTag = 1;

  const [success, balancesAll] = await multicallProvider.all(calls, blockTag); // [success, [balance0, balance1, balance2]]

  // or

  const balancesTryAll = await multicallProvider.tryAll(calls, blockTag); // [{ success, returnData: balance0 }, { success, returnData: balance1 }, { success, returnData: balance2 }]

  // or

  const [successGrouped, balancesGrouped] = await multicallProvider.groupAll(
    addresses.map((address) => [token.balanceOf(address), token.allowance(address, createAddress("0x4"))])
  ); // [success, [[balance0, allowance0], [balance1, allowance1], [balance2, allowance2]]]

  // or

  const balancesGroupTryAll = await multicallProvider.groupTryAll(
    addresses.map((address) => [token.balanceOf(address), token.allowance(address, createAddress("0x4"))])
  ); // [
  // [{ success, returnData: balance0 }, { success, returnData: allowance0 }],
  // [{ success, returnData: balance1 }, { success, returnData: allowance1 }],
  // [{ success, returnData: balance2 }, { success, returnData: allowance2 }],
  //]
}
```

#### How to use it

- `MulticallProvider(provider, chainId?)`: Creates a `MulticallProvider` instance through an ethers provider `provider`.
  If `chainId` is specified, it's not necessary to call `init()` before making calls.
- `MulticallProvider.setMulticall2Addresses(addresses)`: Allows overriding and adding support to more networks by
  specifying a valid `Multicall2` contract address to it.
- `init()`: Fetches the provider's chain ID and and loads a `Multicall2` contract address. If there's no known address for that network, it throws an error.
- `all(calls, blockTag?, batchSize?)`: Performs the calls in `blockTag` with `batchSize` sized multicalls and requires
  success of all of them. By default, `batchSize` is `50`.
- `tryAll(calls, blockTag?, batchSize?)`: Performs the calls in `blockTag` with `batchSize` sized multicalls and
  doesn't require their success, returning a flag for each of them that indicates whether they were successful or not.
  By default, `batchSize` is `50`.
- `groupAll(calls, blockTag?, batchSize?)`: Works in the same way as `all()`, but allows specifying groups of calls
  (e.g. `[[call0, call1], [call2, call3]]`) and keeps that same structure in the returned data.
- `groupTryAll(calls, blockTag?, batchSize?)`: Works in the same way as `tryAll()`, but allows specifying groups of calls
  (e.g. `[[call0, call1], [call2, call3]]`) and keeps that same structure in the returned data.

### VictimIdentifier

This is a class library that identifies protocol victims:

1.  during the preparation stage of an attack, where victims are contained in a newly deployed contract's code
2.  during the exploitation stage of an attack, in transactions where the victim protocol's balance is reduced:
    - more than $100, when denominated in USD, or
    - more than 5% of the token's total supply.

The library also calculates the `Confidence Level` (0-1) for each of the victims:

- Preparation stage:
  - The `Confidence Level` is determined based on the number of occurrences of the victim address in previously deployed contracts code.
- Exploitation stage:
  - The `Confidence Level` is determined either based on the USD value (with $500000 or more being the CL: 1 and by then splitting the CL into 10 parts) or based on the percentage of the token's total supply in which case there are 4 levels of confidence (5%-9%: CL 0.7, 10%-19%: CL 0.8, 20-29%%: CL 0.9, >30%: CL 1)

Supported chains:

- Ethereum Mainnet
- BNB Smart Chain
- Polygon Mainnet
- Fantom Opera
- Arbitrum One
- Optimism Mainnet
- Avalanche

Basic usage:

```ts
import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import { VictimIdentifier } from "forta-agent-tools";

const keys = {
  ethplorerApiKey: "...",
  moralisApiKey: "...",
  etherscanApiKey: "...",
  optimisticEtherscanApiKey: "...",
  bscscanApiKey: "...",
  polygonscanApiKey: "...",
  fantomscanApiKey: "...",
  arbiscanApiKey: "...",
  snowtraceApiKey: "...",
};

export const provideHandleTransaction =
  (victimsIdentifier: VictimIdentifier): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const victims = await victimsIdentifier.getIdentifiedVictims(txEvent);
    /*Returns an object of type: 
    {
      exploitationStage: Record<string, {
          protocolUrl: string;
          protocolTwitter: string;
          tag: string;
          holders: string[];
          confidence: number;
      }>;
      preparationStage: Record<string, {
          protocolUrl: string;
          protocolTwitter: string;
          tag: string;
          holders: string[];
          confidence: number;
      }>;
    }
    */

    // Rest of the logic
    return findings;
  };

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(new VictimIdentifier(getEthersProvider(), keys)),
};
```

#### How to use it

- Create a config file with any of the following optional API keys:
  - Ethplorer API (Fetches the addresses of pool tokens holders)
  - Moralis API (Fetches token prices when CoinGecko calls fail)
  - Block Explorer APIs (Fetches the address of a contract's creator / a contract name)
    - Etherscan
    - Optimistic Etherscan
    - Bscscan
    - Polygonscan
    - Fantomscan
    - Arbiscan
    - Snowtrace
- Initialize a `VictimIdentifier` instance that takes as parameters: 1) an ethers provider and 2) the API keys.
- Call `VictimIdentifier`'s method `getIdentifiedVictims()` which takes as an input a `TransactionEvent`.
