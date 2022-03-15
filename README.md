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
- `CallParams`
    > This is an object containing two properties an `inputs` array and a `outputs` array.

## Approaches

### - Function Call Detector Handler

This approach detects method calls on Smart Contracts. You need to provide the signature of the method you want to detect. You can also provide options for specifying extra filters as "what account made the call" or "what contract was called".
#### How to use it
```ts
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";

const handler = provideFunctionCallsDetectorHandler (findingGenerator, functionSignature, handlerOptions?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `from`: The account calling the method.
  - `to`: The Smart Contract called.
  - `functionSelector`: The function selector of the transaction (The keccak256 hash of the signature of the function being called).
  - `arguments`: The arguments used for calling the function.
- `functionSignature`: The signature of the method you want to detect.
- `handlerOptions`: This is an optional argument, it contains extra information for adding extra filtering to your detections. It is a JS object with the following optional properties:
  - `from`: If provided, the approach will only detect method calls from the specified account.
  - `to`: If provided, the approach will only detect method calls to the specified Smart Contract.
  - `filterOnArguments`: This is a predicate receiving an array with the arguments used for calling the function. If provided, the approach will only detect method calls with arguments fitting with the passed predicate.


### - Event Checker Handler 

This approach detects events emitted. You need to provide the signature of the event you want to detect. You can also provide other arguments for specifying extra filters as "who did emit the event" or manually adding a specific filtering function.

#### How to use it
```ts
import { provideEventCheckerHandler } from "forta-agent-tools";

const handler = provideEventCheckerHandler(findingGenerator, eventSignature, address?, filter?);
```

#### Arguments

- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `eventFragment`: An ethers.js EventFragment object related to the specific event.
  - `name`: The event name.
  - `signature`: The event signature.
  - `topic`: The topic hash.
  - `args`: The event input parameter values (both index-based and key-based access based on parameter order and names).
  - `address`: The log originating address.
- `eventSignature`: The event signature to be detected.
- `address`: If provided, the approach will only detect events emitted from the specified account.
- `filter`: If provided, the approach will only detect events that are not discarded by the filter. This function has the type `(log: LogDescription, index?: number, array?: LogDescription[]) => boolean`, it will be used as argument for the common `filter` arrays function.

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
import { TestTransactionEvent } from "forta-agent-tools/tests";

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
- `addEventLog(eventSignature, address, data, topics)` This method add a log to the `receipt.logs` field. The only mandatory argument is the `eventSignature`, `address` argument is the zero address by default, `topics` is an spread list with the indexed event arguments, and `data` is the empty string by default.
  > The `keccak256` hash of the signature is added at the beggining of the `topics` list automatically.
- `addAnonymousEventLog(address, data, topics)` This method add a log to the `receipt.logs` field. `address` argument is the zero address by default, `topics` is an spread list with the indexed event arguments, and `data` is the empty string by default.
- `addInterfaceEventLog(event, address, inputs, validateInputs)` This method adds a log to the `receipt.logs` field. `inputs` argument is an object that maps each event parameter name to its value and is an empty object by default, `validateInputs` is a flag which states whether `inputs` should be validated to check for unspecified parameters and is true by default.
- `addInvolvedAddresses(addresses)` This method add an spread list of addresses to `addresses` field.
- `addTrace(traceProps)` This method adds a list of `Trace` objects at the end of `traces` field in the event. The traces are created from the `traceProps` spread list.
  > `TraceProps` is a TS object with the following optional fields `{ to, from, input, output }`.

###  TestBlockEvent

This is a helper class for creating `BlockEvents` using the fluent interface pattern.

#### How to use it

```ts
import { TestBlockEvent } from "forta-agent-tools/tests";

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
import { runBlock } from "forta-agent-tools/tests";

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


### MockEtherProvider

This is helper class for mocking the `ethers.providers.Provider` class.

Basic usage:
```ts
import { 
  MockEthersProvider, 
  encodeParameter, 
  createAddress,
} from "forta-agent-tools/tests";
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

This mock provides some methods to set up the values the provider should return:
- `addCallTo(contract, block, iface, id, { inputs, outputs })`. This method prepare a call to the `contract` address
  at the specified `block`, where `iface` is the `ethers.utils.Interface` object relative to the contract, `id` is the identifier 
  of the function to call, `inputs` are the parameters passed in the call and `outputs` the values the call 
  should return.
- `addCallFrom(contract, from, block, iface, id, { inputs, outputs })`. Similar to `addCallTo` but the only `from` will be able to call
  the function.
- `addStorage(contract, slot, block, result)`. This method prepare the value stored in the specific `slot` of `contract` address
  in the given `block` to be `result`.
- `addBlock(blockNumber, block)`. This method prepare the block with number `blockNumber` to be `block`.
- `setLatestBlock(block)`. This method allow you to set up what is the number of the latest block in the provider.
- `addSigner(addr)`. This function prepare a valid signer for the given address that use the provider being used.
- `clear()`. This function clear all the mocked data.

All the data you set in the provider will be used until the `clear` function is called.


### MockEtherSigner

This is helper class for mocking the `ethers.providers.JsonRpcSigner` class. This class extends `MockEthersProvider`.

Basic usage:
```ts
import { 
  MockEthersProvider,
  MockEthersSigner, 
  encodeParameter, 
  createAddress,
} from "forta-agent-tools/tests";
import { utils, Contract } from "ethers";

const iface: utils.Interface =  new utils.Interface([
  "function myAwersomeFunction(uint256 param1, string param2)"
]);

const address: string = createAddress("0xf00");
const contract: string = createAddress("0xda0");

const mockProvider: MockEthersProvider = new MockEthersProvider();
const mockSigner: MockEthersSigner = new MockEthersProvider(mockProvider)
  .setAddress(from)
  .allowTransaction(
    address, contract, iface,
    "myAwersomeFunction", [20, "twenty"]
    { confirmations: 42 }, // receipt data
  )
```

#### How to use it

This mock provides some methods to set up the values the signer should return:
- `setAddress(address)`. This method set the address that the signer can sign.
- `allowTransaction(from, to, iface, id, inputs)`. This method prepare the a txn sent to `to` and signed from `from`. The transaction is ment to call the method `id` taken from the `iface` of the `to` contract passing the `inputs` as parameters. `receipt` will be the receipt returned by the transaction.
- `denyTransaction(from, to, iface, id, inputs, msg)`. Same conditions of `allowTransaction` but in this case the transaction will be reverted with `msg` message.

All the data you set in the signer will be used until the `clear` function is called.
