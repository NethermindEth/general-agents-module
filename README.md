# General Agent Module

### Description

This is a general agent building module, which developers can import and start building their agents upon it.

### Installation

- Using npm: `npm i <public link>`

or

- Clone the repo
- npm install
- npm run test

### Usage

There are several api imports availaible:

##### Function Call Detector Agent

```
import {provideFunctionCallsDetectorAgent} from "general-agent-module";

const agent = await provideFunctionCallsDetectorAgent(findingGenerator, functionSignature, agentOptions?);
```

##### Event Checker Agent

```
import {provideEventCheckerHandler} from "general-agent-module";

const agent = await provideEventCheckerHandler(findingGenerator, functionSignature, address?);
```

##### Eth Transfer Agent

```
import {provideETHTransferAgent} from "general-agent-module";

const agent = await provideETHTransferAgent(findingGenerator, agentOptions?);
```

##### ERC20 Transfer Agent

```
import {provideERC20TransferAgent} from "general-agent-module";

const agent = await provideERC20TransferAgent(findingGenerator,  tokenAddress, agentOptions?);
```

### Types

##### Agent Options

```
agentOptions = {
  from?: string;
  to?: string;
  amountThreshold?: string;
};
```

##### Finding

```
 name: string;
 description: string;
 alertId: string;
 protocol: string;
 severity: FindingSeverity;
 type: FindingType;
 everestId: string | undefined;
 metadata: {
    [key: string]: string;
};
```
