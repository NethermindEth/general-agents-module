# General Agent Module

## Description

This module contains some common approaches for building Forta Agents. You will also find some tools for writing tests for these agents. These approaches can be composed for creating more complex agents or used only for checking without returning their findings.

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
  signature: "function func(uint256 param) returns (uint256 resp)",
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

- `signature`: Function signature to be monitored.
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

###  TestTransactionEvent

This is a helper class for creating `TransactionEvents` using the fluent interface pattern.

#### How to use it

```ts
import { TestTransactionEvent } from "forta-agent-tools/lib/tests";

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
- `setStatus(status)` This method sets the `receipt.status` field in the event.
- `setTimestamp(timestamp)` This method sets the `block.timestamp` field in the event.
- `setBlock(block)` This method sets the `block.number` field in the event.
- `addEventLog(eventSignature, address, data, topics)` This method adds a log to the `receipt.logs` field. The only mandatory argument is the `eventSignature`, `address` argument is the zero address by default, `topics` is a spread list with the indexed event arguments, and `data` is the empty string by default.
  > The `keccak256` hash of the signature is added at the beginning of the `topics` list automatically.
- `addAnonymousEventLog(address, data, topics)` This method adds a log to the `receipt.logs` field. `address` argument is the zero address by default, `topics` is a spread list with the indexed event arguments, and `data` is the empty string by default.
- `addInterfaceEventLog(event, address, inputs)` This method adds a log to the `receipt.logs` field. `event` is an `ethers.utils.EventFragment` instance, `address` argument is the zero address by default, `inputs` argument is an array of event parameter values and is an empty array by default.
- `addInvolvedAddresses(addresses)` This method adds a spread list of addresses to `addresses` field.
- `addTrace(traceProps)` This method adds a list of `Trace` objects at the end of `traces` field in the event. The traces are created from the `traceProps` spread list.
  > `TraceProps` is a TS object with the following optional fields `{ to, from, input, output }`.

###  TestBlockEvent

This is a helper class for creating `BlockEvents` using the fluent interface pattern.

#### How to use it

```ts
import { TestBlockEvent } from "forta-agent-tools/lib/tests";

const blockEvent: BlockEvent = new TestBlockEvent().setHash(blockHash).setNumber(blockNumber);
```

There are multiple methods you can use for creating the exact `BlockEvent` you want:
- `setHash(blockHash)` This method sets the `block.hash` field in the event.
- `setNumber(blockNumber)` This method sets the `block.number` field in the event.
- `addTransactions(txns)` This method adds the hashes of a spread list of transaction events at the end of `block.transactions` field in the event.
- `addTransactionsHashes(hashes)` This method adds a hashes spread list to the end of `block.transactions` field in the event.

###  runBlock

This is a helper function to simulate the execution of `run block` cli command when the agent has implemented a `handleTransaction` and a `handleBlock`.

#### How to use it

```ts
import { runBlock } from "forta-agent-tools/lib/tests";

async myFunction(params) => {
  ...
  const findings: Findings[] = await runBlock(agent, block, tx1, tx2, tx3, ..., txN);
  ...
};
```
Parameters description:
- `agent`: It is a JS object with two properties, `handleTransaction` and `handleBlock`.
- `block`: It is the `BlockEvent` that the agent will handle.
- `tx#`: These are the `TransactionEvent` objects asociated with the `BlockEvent` that the agent will handle.


### MockEtherProvider

This is a helper class for mocking the `ethers.providers.Provider` class.

Basic usage:
```ts
import { 
  MockEthersProvider, 
  encodeParameter, 
  createAddress,
} from "forta-agent-tools/lib/tests";
import { utils, Contract } from "ethers";

const iface: utils.Interface =  new utils.Interface([
  "function myAwersomeFunction(uint256 param1, string param2) extenal view returns (unit8 id, uint256 val)"
]);

const address: string = createAddress("0xf00");
const data: string = createAddress("0xda7a");

const mockProvider: MockEthersProvider = new MockEthersProvider()
  .addCallTo(
    address, 20, iface,
    "myAwersomeFunction",
    { inputs:[10, "tests"], outputs:[1, 2000]},
  )
  .addStorage(address, 5, 15, encodeParameter("address", data));
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
- `addFilteredLogs(filter, logs)`. This method allows you to set up the `logs` returned by the provider given a `filter`. This method will not actually filter the logs as it would be if the logs were added through `addLogs`, it will simply return `logs` when `getLogs(filter)` is called. (**DEPRECATED**, use `addLogs` instead)
- `addLogs(logs)`. This method allows you to add entries to the logs record that will be filtered in `getLogs` if the filter specified wasn't yet added in `addFilteredLogs`.
- `setNetwork(chainId, ensAddress?, name?)`. This method allows you to set up the network information (`chainId`, `ensAddress` and `name`) that will be returned when there's a call to `getNetwork`.
- `clear()`. This function clears all the mocked data.

All the data you set in the provider will be used until the `clear` function is called.


### MockEtherSigner

This is a helper class for mocking the `ethers.providers.JsonRpcSigner` class. This class extends `MockEthersProvider`.

Basic usage:
```ts
import { 
  MockEthersProvider,
  MockEthersSigner, 
  encodeParameter, 
  createAddress,
} from "forta-agent-tools/lib/tests";
import { utils, Contract } from "ethers";

const iface: utils.Interface =  new utils.Interface([
  "function myAwersomeFunction(uint256 param1, string param2)"
]);

const address: string = createAddress("0xf00");
const contract: string = createAddress("0xda0");

const mockProvider: MockEthersProvider = new MockEthersProvider();
const mockSigner: MockEthersSigner = new MockEthersSigner(mockProvider)
  .setAddress(from)
  .allowTransaction(
    address, contract, iface,
    "myAwersomeFunction", [20, "twenty"]
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
