# General Agent Module

## Description

This module contains some common approaches for building Forta Agents. You will also find some tools for writing tests for these agents. These approaches can be composed for creating more complex agents or used only for checking without returning their findings.

## Installation

- Using npm: `npm install @nethermindeth/general-agents-module`

or

- Clone the repo
- npm install
- npm run test

## General Types

There are multiple types used across all the module.

-  `metadataVault`
    > This type works as a store for every data that is passed to the `FindingGenerator`. It is a `dict` with `string` as keys and `any` type in its values.
-  `FindingGenerator`
    > All the approaches receives a function with this type. This function will be in charge of creating the Findings when the agent's conditions are met. This function can receives a `metadataVault` as parameter where finding's relevant information will be pass, this information can be used for creating more informative findings. This type is an alias for `(metadata?: metadataVault) => Finding`. The information set in the `metadataVault` for every approach will be describe in the approach documentation.

## Approaches

### - Function Call Detector Agent

This approach detects method calls on Smart Contracts. You need to provide the signature of the method you want to detect. You can also provide options for specifying extra filters as "what account made the call" or "what contract was called".
#### How to use it
```
import { provideFunctionCallsDetectorAgent } from "@nethermindeth/general-agent-module";

const agent = await provideFunctionCallsDetectorAgent(findingGenerator, functionSignature, agentOptions?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in "General Types" section. The function provided as argument will receive a `metadataVault` with the keys:
  - `from`: The account calling the method.
  - `to`: The Smart Contract called.
  - `input`: The transaction data.
- `functionSignature`: The signature of the method you want to detect.
- `agentOptions`: This is an optional argument, it contains extra information for adding extra filtering to your detections. It is a JS object with the following optional properties:
  - `from`: If provided, the approach will only detects method calls from the specified account.
  - `to`: If provided, the approach will only detects method calls to the specified Smart Contract.


### - Event Checker Agent

This approach detects events emitted. You need to provide the signature of the event you want to detect. You can also provide other arguments for specifying extra filters as "who did emit the event" or manually adding an specific filtering function.
#### How to use it
```
import { provideEventCheckerHandler } from "@nethermindeth/general-agent-module";

const agent = await provideEventCheckerHandler(findingGenerator, eventSignature, address?, filter?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in "General Types" section. The function provided as argument will receive a `metadataVault` with the keys:
  - `topics`: An array containing the event's topics.
  - `data`: The event's data
  - `address`: The address emitting the event.
- `address`: If provided, the approach will only detects events emitted from the specified account.
- `filter`: If provided, the approach will only detects events if they are not filtered by the provided function. This function has the type `(log: Log, index?: number, array?: Log[]) => boolean`, it will be used as argument for the common `filter` arrays function.

### - Eth Transfer Agent

This approach detects eth transfers. You can also provide more arguments for specifying extra filters as "who made the transfer", "who is the receiver", and a minimum amount for detecting transfers

#### How to use it

```
import { provideETHTransferAgent } from "@nethermindeth/general-agent-module";

const agent = await provideETHTransferAgent(findingGenerator, agentOptions?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in "General Types" section. The function provided as argument will receive a `metadataVault` with the keys:
  - `from`: The account making the transfer.
  - `to`: The account receiving the transfer.
  - `amount`: The amount of `eth` sent in `wei`.
- `agentOptions`: This is an optional argument, it contains extra information for adding extra filtering to your detections. It is a JS object with the following optional properties:
  - `from`: If provided, the approach will only detects transfers from the specified account.
  - `to`: If provided, the approach will only detects transfers to the specified account.
  - `valueThreshold`: If provided, the approach will only detects transfers with a greater or equal amount of `eth` in `wei`.


### - ERC20 Transfer Agent

This approach detects ERC-20 transfers. You will need to provide the address of the ERC-20 contract you want to detect transfers of. You can also provide more arguments for specifying extra filters as "who made the transfer", "who is the receiver of the transfer". and a minimum amount for detecting transfers.

#### How to use it

```
import { provideERC20TransferAgent } from "@nethermindeth/general-agent-module";

const agent = await provideERC20TransferAgent(findingGenerator,  tokenAddress, agentOptions?);
```

#### Arguments
- `findingGenerator`: The purpose of this argument was explained in "General Types" section. The function provided as argument will receive a `metadataVault` with the keys:
  - `from`: The account making the transfer.
  - `to`: The account receiving the transfer.
  - `amount`: The amount of tokens sent
- `tokenAddress`: The address of the ERC-20 contract you want to detect transfers of.
- `agentOptions`: This is an optional argument, it contains extra information for adding extra filtering to your detections. It is a JS object with the following optional properties:
  - `from`: If provided, the approach will only detects transfers from the specified account.
  - `to`: If provided, the approach will only detects transfers to the specified account.
  - `valueThreshold`: If provided, the approach will only detects transfers with a greater or equal amount tokens.

## Utils

###  TestTransactionEvent

This is a helper class for creating `TransactionEvents` using the fluent interface pattern.

#### How to use it

```
import { TestTransactionEvent } from "@nethermindeth/general-agent-module";

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
- `addEventLog(eventSignature, address, topics, data)` This method add a log to the `receipt.logs` field. The only mandatory argument is the `eventSignature`, `address` argument is address zero by default, `topics` is a list with only the `keccak256` hash of the signature by default, and `data` is the empty string by default.
- `addInvolvedAddress(address)` This method add an address to `addresses` field.
- `addTrace({ to, from, input, output })` This method add an item to the `traces` field. All the fields in the argument are optional.
   