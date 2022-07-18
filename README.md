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
    > All the approaches receive a function with this type. This function will be in charge of creating the Findings when the agent's conditions are met. This function can receive a `metadataVault` as a parameter where finding relevant information will be passed, this information can be used for creating more informative findings. This type is an alias for `(metadata?: metadataVault) => Finding`. The information set in the `metadataVault` for every approach will be described in the approach documentation.
- `CallParams`
    > This is an object containing two properties, an `inputs` array and an `outputs` array.

## Approaches

### - Function Call Detector Handler

This approach detects method calls on Smart Contracts. You need to provide the signature of the method you want to detect. You can also provide options for specifying extra filters, such as "what account made the call" or "what contract was called".
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

This approach detects events emitted. You need to provide the signature of the event you want to detect. You can also provide other arguments for specifying extra filters as "who emitted the event" or manually adding a specific filtering function.

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
- `filter`: If provided, the approach will only detect events that are not discarded by the filter. This function has the type `(log: LogDescription, index?: number, array?: LogDescription[]) => boolean`, it will be used as an argument for the common `filter` arrays function.

### - ETH Transfer Handler

This approach detects ETH transfers. You can also provide more arguments for specifying extra filters, such as "who made the transfer", "who is the receiver", and a minimum amount for detecting transfers.

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

This approach detects ERC-20 transfers. You will need to provide the address of the ERC-20 contract you want to detect transfers of. You can also provide more arguments for specifying extra filters, such as "who made the transfer", "who is the receiver of the transfer", and a minimum amount for detecting transfers.

#### How to use it

```ts
import { provideERC20TransferHandler } from "forta-agent-tools";

const handler = provideERC20TransferHandler(findingGenerator,  tokenAddress, agentOptions?);
```

#### Arguments
- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the keys:
  - `from`: The account making the transfer.
  - `to`: The account receiving the transfer.
  - `amount`: The number of tokens sent.
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

- `findingGenerator`: The purpose of this argument was explained in the "General Types" section. The function provided as an argument will receive a `metadataVault` with the key:
  - `addresses`: The list of blacklisted addresses involved in the transaction.
- `blacklistedAddressesList`: The list of blacklisted addresses.
  

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
- Binance Smart Chain
- Binance Smart Chain Testnet
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
  const calls = addresses.map(address => token.balanceOf(address));
  const blockTag = 1;

  const [success, balancesAll] = await multicallProvider.all(calls, blockTag); // [success, [balance0, balance1, balance2]]

  // or

  const balancesTryAll = await multicallProvider.tryAll(calls, blockTag); // [{ success, returnData: balance0 }, { success, returnData: balance1 }, { success, returnData: balance2 }]

  // or

  const [successGrouped, balancesGrouped] = await multicallProvider.groupAll(
    addresses.map(address => [token.balanceOf(address), token.allowance(address, createAddress("0x4"))])
  ); // [success, [[balance0, allowance0], [balance1, allowance1], [balance2, allowance2]]]

  // or

  const balancesGroupTryAll = await multicallProvider.groupTryAll(
    addresses.map(address => [token.balanceOf(address), token.allowance(address, createAddress("0x4"))])
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
- `groupAll(calls, blockTag?, batchSize?)`: Works in the same way as `tryAll()`, but allows specifying groups of calls
(e.g. `[[call0, call1], [call2, call3]]`) and keeps that same structure in the returned data.
