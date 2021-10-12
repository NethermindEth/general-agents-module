# General Agent Module

## Description

This module contains some common approaches for building Forta Agents. You will also find some tools for writing tests for these agents. These approaches can be composed for creating more complex agents or used only for checking without returning their findings.

## Installation

- Using npm: `npm i forta-agent-tools`

or

- Clone the repo
- npm install
- npm run test

## General Types

There are multiple types used across all the modules.

-  `metadataVault`
    > This type works as a store for every data that is passed to the `FindingGenerator`. It is a `dict` with `string` as keys and `any` type in its values.
-  `FindingGenerator`
    > All the approaches receive a function with this type. This function will be in charge of creating the Findings when the agent's conditions are met. This function can receive a `metadataVault` as a parameter where finding relevant information will be pass, this information can be used for creating more informative findings. This type is an alias for `(metadata?: metadataVault) => Finding`. The information set in the `metadataVault` for every approach will be described in the approach documentation.

## Approaches

### - Function Call Detector Handler

This approach detects method calls on Smart Contracts. You need to provide the signature of the method you want to detect. You can also provide options for specifying extra filters as "what account made the call" or "what contract was called".
#### How to use it
```ts
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";

const handler = provideFunctionCallsDetectorHandler (findingGenerator, functionSignature, agentOptions?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `from`: The account calling the method.
  - `to`: The Smart Contract called.
  - `input`: The transaction data.
- `functionSignature`: The signature of the method you want to detect.
- `agentOptions`: This is an optional argument, it contains extra information for adding extra filtering to your detections. It is a JS object with the following optional properties:
  - `from`: If provided, the approach will only detect method calls from the specified account.
  - `to`: If provided, the approach will only detect method calls to the specified Smart Contract.


### - Event Checker Handler 

This approach detects events emitted. You need to provide the signature of the event you want to detect. You can also provide other arguments for specifying extra filters as "who did emit the event" or manually adding a specific filtering function.
#### How to use it
```ts
import { provideEventCheckerHandler } from "forta-agent-tools";

const handler = provideEventCheckerHandler(findingGenerator, eventSignature, address?, filter?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `topics`: An array containing the event's topics.
  - `data`: The event's data
  - `address`: The address emitting the event.
- `address`: If provided, the approach will only detect events emitted from the specified account.
- `filter`: If provided, the approach will only detect events that are not discarded by the filter. This function has the type `(log: Log, index?: number, array?: Log[]) => boolean`, it will be used as argument for the common `filter` arrays function.

### - Eth Transfer Handler

This approach detects eth transfers. You can also provide more arguments for specifying extra filters as "who made the transfer", "who is the receiver", and a minimum amount for detecting transfers

#### How to use it

```ts
import { provideETHTransferHandler } from "forta-agent-tools";

const handler = provideETHTransferHandler(findingGenerator, agentOptions?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `from`: The account making the transfer.
  - `to`: The account receiving the transfer.
  - `amount`: The amount of `eth` sent in `wei`.
- `agentOptions`: This is an optional argument, it contains extra information for adding extra filtering to your detections. It is a JS object with the following optional properties:
  - `from`: If provided, the approach will only detect transfers from the specified account.
  - `to`: If provided, the approach will only detect transfers to the specified account.
  - `valueThreshold`: If provided, the approach will only detect transfers with a greater or equal amount of `eth` in `wei`.

### - ERC20 Transfer Handler

This approach detects ERC-20 transfers. You will need to provide the address of the ERC-20 contract you want to detect transfers of. You can also provide more arguments for specifying extra filters as "who made the transfer", "who is the receiver of the transfer". and a minimum amount for detecting transfers.

#### How to use it

```ts
import { provideERC20TransferHandler } from "forta-agent-tools";

const handler = provideERC20TransferHandler(findingGenerator,  tokenAddress, agentOptions?);
```

#### Arguments
- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `from`: The account making the transfer.
  - `to`: The account receiving the transfer.
  - `amount`: The number of tokens sent
- `tokenAddress`: The address of the ERC-20 contract you want to detect transfers of.
- `agentOptions`: This is an optional argument, it contains extra information for adding extra filtering to your detections. It is a JS object with the following optional properties:
  - `from`: If provided, the approach will only detect transfers from the specified account.
  - `to`: If provided, the approach will only detect transfers to the specified account.
  - `valueThreshold`: If provided, the approach will only detect transfers with a greater or equal number of tokens.

### - Blacklisted Addresses Handler

This approach detects transactions involving at least one blacklisted address. You will need to provide a list with the addresses you want to blacklist.

#### How to use it

```ts
import { provideBlacklistedAddressesHandler } from "forta-agent-tools";

const agent = provideBlacklistedAddressesHandler(findingGenerator, blacklistedAddressesList);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `addresses`: The list of blacklisted addresses involved in the transaction.
- `blacklistedAddressesList`: The list of blacklisted addresses.
  

## Utils

###  TestTransactionEvent

This is a helper class for creating `TransactionEvents` using the fluent interface pattern.

#### How to use it

```ts
import { TestTransactionEvent } from "forta-agent-tools";

const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(address1).setTo(address2);
```

There are multiple methods you can use for creating the exact `TransactionEvent` you want:
- `setFrom(address)` This method sets the `transaction.from` field in the event.
- `setTo(address)` This method sets the `transaction.to` field in the event.
- `setValue(value)` This method sets the `transaction.value` field in the event.
- `setData(data)` This method sets the `transaction.data` field in the event.
- `setGasUsed(value)` This method sets the `receipt.gasUsed` field in the event.
- `setStatus(status)` This method sets the `receipt.status` field in the event.
- `setTimestamp(timestamp)` This method sets the `block.timestamp` field in the event.
- `addEventLog(eventSignature, address, data, topics)` This method add a log to the `receipt.logs` field. The only mandatory argument is the `eventSignature`, `address` argument is the zero address by default, `topics` is an spread list with the indexed event arguments, and `data` is the empty string by default.
  > The `keccak256` hash of the signature is added at the beggining of the `topics` list automatically.
- `addInvolvedAddresses(addresses)` This method add an spread list of addresses to `addresses` field.
- `addTrace(traceProps)` This method adds a list of `Trace` objects at the end of `traces` field in the event. The traces are created from the `traceProps` spread list.
  > `TraceProps` is a TS object with the following optional fields `{ to, from, input, output }`.

###  TestBlockEvent

This is a helper class for creating `BlockEvents` using the fluent interface pattern.

#### How to use it

```ts
import { TestBlockEvent } from "forta-agent-tools";

const blockEvent: BlockEvent = new TestBlockEvent().setHash(blockHash).setNumber(blockNumber);
```

There are multiple methods you can use for creating the exact `BlockEvent` you want:
- `setHash(blockHash)` This method sets the `block.hash` field in the event.
- `setNumber(blockNumber)` This method sets the `block.number` field in the event.
- `addTransactions(txns)` This method adds the hashes of an spread list of transaction events at the end of `block.transactions` field in the event.
- `addTransactionsHashes(hashes)` This method adds a hashes spread list to the end of `block.transactions` field in the event.

###  runBlock

This is a helper function to simulate the execution of `run block` cli command when the agent has implemented a `handleTransaction` and a `handleBlock`.

#### How to use it

```ts
import { runBlock } from "forta-agent-tools";

async myFunction(params) => {
  ...
  const findings: Findings[] = await runBlock(agent, block, tx1, tx2, tx3, ..., txN);
  ...
};
```
Parameter description:
- `agent`: It is a JS object with two properties, `handleTransaction` and `handleBlock`.
- `block`: It is the `BlockEvent` that the agent will handle.
- `tx#`: These are the `TransactionEvent` objects asociated with the `BlockEvent` that the agent will handle.

