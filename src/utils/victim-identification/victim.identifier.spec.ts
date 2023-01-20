import VictimIdentifier from "./victim.identifier";
import fetch from "node-fetch";
import { Interface } from "ethers/lib/utils";
import { when } from "jest-when";
import { AlertsResponse } from "forta-agent/dist/sdk/graphql/forta";
import { ERC20_TRANSFER_EVENT, TOKEN_ABI } from "./helpers/constants";
import { ethers, Trace } from "forta-agent";
import { createAddress } from "..";
import { TestTransactionEvent, MockEthersProvider } from "../../test";

let mockAlertsResponse: AlertsResponse;
var mockGetAlerts: jest.Mock;

jest.mock("forta-agent", () => {
  const original = jest.requireActual("forta-agent");
  return {
    ...original,
    getAlerts: (mockGetAlerts = jest.fn(() => Promise.resolve(mockAlertsResponse))),
  };
});

jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");

let opcodesToReturn: any[] = [];
// mocking the evm module
jest.mock("evm", () => {
  return {
    EVM: jest.fn().mockImplementation(() => {
      return {
        getOpcodes: () => {
          return opcodesToReturn;
        },
      };
    }),
  };
});

interface TraceProps2 {
  function?: ethers.utils.FunctionFragment | string;
  to?: string;
  from?: string;
  arguments?: any[];
  output?: any[];
  value?: string;
  traceAddress?: number[];
  address?: string;
  type?: string;
  callType?: string;
}

class TestTransactionEventExtended extends TestTransactionEvent {
  constructor() {
    super();
  }

  public addTraces2(...traceProps: TraceProps2[]): TestTransactionEventExtended {
    const toTrace = (props: TraceProps2) => {
      if (!props.function) {
        return {
          action: {
            to: props.to?.toLowerCase(),
            from: props.from?.toLowerCase(),
            value: props.value,
            callType: props.callType,
          },
          result: {
            address: props.address?.toLowerCase(),
          },
          type: props.type,
          traceAddress: props.traceAddress,
        } as Trace;
      }

      const functionFragment = ethers.utils.FunctionFragment.from(ethers.utils.Fragment.from(props.function));
      const iface = new ethers.utils.Interface([functionFragment]);
      return {
        action: {
          to: props.to?.toLowerCase(),
          from: props.from?.toLowerCase(),
          input: iface.encodeFunctionData(functionFragment, props.arguments),
          value: props.value,
          callType: props.callType,
        },
        result: {
          address: props.address?.toLowerCase(),
          output: iface.encodeFunctionResult(functionFragment, props.output),
        },
        type: props.type,
        traceAddress: props.traceAddress,
      } as Trace;
    };

    this.traces.push(...traceProps.map(toTrace));

    return this;
  }
}

class MockEthersProviderExtended extends MockEthersProvider {
  public getCode: any;

  constructor() {
    super();
    this.getCode = jest.fn();
  }

  public setCode(address: string, code: string, blockNumber: number): MockEthersProviderExtended {
    when(this.getCode).calledWith(address, blockNumber).mockReturnValue(Promise.resolve(code));
    return this;
  }

  public addStorageExtended(
    contract: string,
    slot: ethers.BigNumberish,
    block: number,
    result: string
  ): MockEthersProvider {
    when(this.getStorageAt).calledWith(contract, slot, block).mockReturnValue(Promise.resolve(result));
    return this;
  }
}

const testKeys = {
  ethplorerApiKey: "Test1",
  luabaseApiKey: "Test2",
  moralisApiKey: "Test3",
  etherscanApiKey: "Test4",
  optimisticEtherscanApiKey: "Test5",
  bscscanApiKey: "Test6",
  polygonscanApiKey: "Test7",
  fantomscanApiKey: "Test8",
  arbiscanApiKey: "Test9",
  snowtraceApiKey: "Test10",
};

const fetchProtocols = () => {
  const mockFetch = jest.mocked(fetch, true);
  mockFetch.mockResolvedValueOnce(
    Promise.resolve(
      new Response(
        JSON.stringify([
          { slug: "uniswap", url: "uniswap.org", twitter: "Uniswap" },
          { slug: "sushiswap", url: "sushiswap.org", twitter: "SushiSwap" },
          { slug: "victim1234", url: "victim1234.org", twitter: "Victim1234Twitter" },
          { slug: "victim5678", url: "victim5678.org", twitter: "Victim5678Twitter" },
        ])
      )
    )
  );
};

describe("Victim Identifier tests suite", () => {
  const mockProvider: MockEthersProviderExtended = new MockEthersProviderExtended();
  let victimIdentifier: VictimIdentifier;

  beforeEach(() => {
    mockGetAlerts.mockClear();
    mockProvider.clear();
    fetchProtocols();
    victimIdentifier = new VictimIdentifier(mockProvider as any, testKeys);
  });

  it("should return an empty record if there is no victim found", async () => {
    const mockTxEvent = new TestTransactionEvent().setBlock(123);
    mockProvider.setNetwork(1);

    mockAlertsResponse = {
      alerts: [
        {
          metadata: {
            address1: createAddress("0x1234"),
            address2: createAddress("0x5678"),
            address2Again: createAddress("0x5678"),
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: {
          alertId: "1234",
          blockNumber: 0,
        },
      },
    };

    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(mockGetAlerts).toHaveBeenCalled();
    expect(victims).toEqual({ exploitationStage: {}, preparationStage: {} });
  });

  it("should not fetch the past alerts twice in the same block", async () => {
    const mockTxEvent = new TestTransactionEvent().setBlock(21123);
    mockProvider.setNetwork(1);

    mockAlertsResponse = {
      alerts: [
        {
          metadata: {
            address1: createAddress("0x1234"),
            address2: createAddress("0x5678"),
            address2Again: createAddress("0x5678"),
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: {
          alertId: "1234",
          blockNumber: 0,
        },
      },
    };

    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(mockGetAlerts).toHaveBeenCalledTimes(1);
    expect(victims).toEqual({ exploitationStage: {}, preparationStage: {} });

    mockGetAlerts.mockClear();
    const mockTxEvent2 = new TestTransactionEvent().setBlock(21123);
    const victims2 = await victimIdentifier.getIdentifiedVictims(mockTxEvent2);
    expect(mockGetAlerts).not.toHaveBeenCalled();
    expect(victims2).toEqual({ exploitationStage: {}, preparationStage: {} });
  });

  it("should return preparation stage victims correctly when the tag can be found", async () => {
    // Contract creation transaction
    const mockTxEvent = new TestTransactionEvent().setBlock(44123).setTo("");
    mockProvider.setNetwork(1);

    mockAlertsResponse = {
      alerts: [
        {
          metadata: {
            // Add 10 occurrences of the "0x1234"
            ...Object.assign(
              {},
              ...Array.from({ length: 10 }, (_, i) => ({
                [`address${i}`]: createAddress("0x1234"),
              }))
            ),
            address10: createAddress("0x5678"),
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: {
          alertId: "1234",
          blockNumber: 0,
        },
      },
    };

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";

    const extractedAddress1 = createAddress("0x1234");
    const extractedAddress2 = createAddress("0x5678");

    // mock the provider's getStorageAt method to return the extracted addresses at the first storage slot of the created contract
    mockProvider.addStorage(createdContractAddress, 0, 44123, extractedAddress1);
    mockProvider.setCode(extractedAddress1, "0x1234", 44123);

    mockProvider.addStorage(createdContractAddress, 1, 44123, extractedAddress2);
    mockProvider.setCode(extractedAddress2, "0x5678", 44123);

    for (let i = 2; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        44123,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // First call is to Forta DB for the 1st extracted contract address
        return Promise.resolve(
          new Response(
            JSON.stringify({
              events: [{ label: { label: "Victim5678" } }],
            })
          )
        );
      } else if (callCount === 2) {
        // As the tag is fetched from Forta on the previous call, the 2nd call is to Ethplorer API in regards to the holders
        return Promise.resolve(
          new Response(
            JSON.stringify({
              holders: [
                { address: createAddress("0x22aabb"), balance: 133, share: 28 },
                { address: createAddress("0x33aabbcc"), balance: 4233, share: 228 },
              ],
            })
          )
        );
      } else if (callCount === 3) {
        // Same process for the 2nd extracted contract address
        return Promise.resolve(
          new Response(
            JSON.stringify({
              events: [{ label: { label: "Victim1234" } }],
            })
          )
        );
      } else if (callCount === 4) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              holders: [
                { address: createAddress("0x44aabb"), balance: 33, share: 28 },
                { address: createAddress("0x55aabbcc"), balance: 233, share: 228 },
              ],
            })
          )
        );
      }
    });

    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {},
      preparationStage: {
        "0x0000000000000000000000000000000000005678": {
          holders: ["0x000000000000000000000000000000000022aabb", "0x0000000000000000000000000000000033aabbcc"],
          protocolTwitter: "Victim5678Twitter",
          protocolUrl: "victim5678.org",
          tag: "Victim5678",
          confidence: 0.6,
        },
        "0x0000000000000000000000000000000000001234": {
          holders: ["0x000000000000000000000000000000000044aabb", "0x0000000000000000000000000000000055aabbcc"],
          protocolTwitter: "Victim1234Twitter",
          protocolUrl: "victim1234.org",
          tag: "Victim1234",
          confidence: 0,
        },
      },
    });
  });

  it("should return a preparation stage victim when the victim contract's creator tag can be found", async () => {
    const mockTxEvent = new TestTransactionEvent().setBlock(144123).setTo("");
    mockProvider.setNetwork(1);

    mockAlertsResponse = {
      alerts: [
        {
          metadata: {
            address1: createAddress("0x1234"),
            address1again: createAddress("0x1234"),
            address2: createAddress("0x5678"),
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: {
          alertId: "1234",
          blockNumber: 0,
        },
      },
    };

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";
    const extractedAddress1 = createAddress("0x1234");

    mockProvider.addStorage(createdContractAddress, 0, 144123, extractedAddress1);
    mockProvider.setCode(extractedAddress1, "0x1234", 144123);

    for (let i = 1; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        144123,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.resolve(new Response(JSON.stringify({})));
      } else if (callCount === 2) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              message: "OOOK",
              result: [{ contractCreator: createAddress("0xccccb") }],
            })
          )
        );
      } else if (callCount === 3) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              events: [{ label: { label: "Uniswap V3: Deployer" } }],
            })
          )
        );
      } else if (callCount === 4) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                positions: [{ owner: createAddress("0x22aabb") }, { owner: createAddress("0x33aabbcc") }],
              },
            })
          )
        );
      }
    });
    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {},
      preparationStage: {
        "0x0000000000000000000000000000000000001234": {
          protocolUrl: "https://uniswap.org/",
          protocolTwitter: "Uniswap",
          tag: "Uniswap V3",
          holders: ["0x000000000000000000000000000000000022aabb", "0x0000000000000000000000000000000033aabbcc"],
          confidence: 0,
        },
      },
    });
  });

  it("should return a preparation stage victim when the victim is an ERC20 token", async () => {
    const mockTxEvent = new TestTransactionEvent().setBlock(344123).setTo("");
    mockProvider.setNetwork(1);

    mockAlertsResponse = {
      alerts: [
        {
          metadata: {
            address1: createAddress("0x1234"),
            address1again: createAddress("0x1234"),
            address2: createAddress("0x5678"),
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: {
          alertId: "1234",
          blockNumber: 0,
        },
      },
    };

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";
    const extractedAddress1 = createAddress("0x1234");

    mockProvider.addStorage(createdContractAddress, 0, 344123, extractedAddress1);
    mockProvider.setCode(extractedAddress1, "0x1234", 344123);

    for (let i = 1; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        344123,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // Forta DB doesn't return the tag
        return Promise.resolve(new Response(JSON.stringify({})));
      } else if (callCount === 2) {
        // Block explorer call to fetch the contract creator address "fails"
        return Promise.resolve(
          new Response(
            JSON.stringify({
              message: "NOTOK",
            })
          )
        );
      }
    });

    const TOKEN_IFACE = new Interface(TOKEN_ABI);
    // Not implementating a mock implementation of the call to the Ethereum lists DB implies a call, so it then tries to fetch the token's name
    mockProvider.addCallTo(extractedAddress1, 344123, TOKEN_IFACE, "name", {
      inputs: [],
      outputs: ["DOGE"],
    });

    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {},
      preparationStage: {
        "0x0000000000000000000000000000000000001234": {
          protocolUrl: "",
          protocolTwitter: "",
          tag: "DOGE",
          holders: [],
          confidence: 0,
        },
      },
    });
  });

  it("should return a preparation stage victim when the victim's tag can be fetched by the contract name", async () => {
    const mockTxEvent = new TestTransactionEvent().setBlock(444123).setTo("");
    mockProvider.setNetwork(1);

    mockAlertsResponse = {
      alerts: [
        {
          metadata: {
            address1: createAddress("0x1234"),
            address1again: createAddress("0x1234"),
            address2: createAddress("0x5678"),
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: {
          alertId: "1234",
          blockNumber: 0,
        },
      },
    };

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";
    const extractedAddress1 = createAddress("0x1234");

    mockProvider.addStorage(createdContractAddress, 0, 444123, extractedAddress1);
    mockProvider.setCode(extractedAddress1, "0x1234", 444123);

    for (let i = 1; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        444123,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }
    mockProvider.addStorageExtended(
      extractedAddress1,
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
      444123,
      "0x000000000000000000000000587969add789c13f64bcc34ff253bd9bfb78f38a"
    );

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // Forta DB doesn't return the tag
        return Promise.resolve(new Response(JSON.stringify({})));
      } else if (callCount === 2) {
        // Block explorer call to fetch the contract creator address "fails"
        return Promise.resolve(
          new Response(
            JSON.stringify({
              message: "NOTOK",
            })
          )
        );
      } else if (callCount === 3) {
        // Not mocking an ERC20 symbol/name call implying a failed call, so it then fetches the contract name
        return Promise.resolve(
          new Response(
            JSON.stringify({
              message: "OOOK",
              result: [{ ContractName: "proxyyyyyy" }],
            })
          )
        );
      } else if (callCount === 4) {
        // Call to the block explorer API to fetch the implementation contract name
        return Promise.resolve(
          new Response(
            JSON.stringify({
              message: "OOOK",
              result: [{ ContractName: "VerifiedContract22" }],
            })
          )
        );
      }
    });

    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {},
      preparationStage: {
        "0x0000000000000000000000000000000000001234": {
          protocolUrl: "",
          protocolTwitter: "",
          tag: "VerifiedContract22",
          holders: [],
          confidence: 0,
        },
      },
    });
  });

  it("should return an exploitation stage victim when its tag is found, exploited via an ERC20 Transfer", async () => {
    const TRANSFER_IFACE = new Interface([ERC20_TRANSFER_EVENT]);
    const TEST_TOKEN = createAddress("0x2222");
    const FROM = createAddress("0x1234");
    const TO = createAddress("0x5678");
    const event = TRANSFER_IFACE.getEvent("Transfer");
    const data = [FROM, TO, ethers.BigNumber.from("3424324324423423")];

    const mockTxEvent = new TestTransactionEvent().setBlock(5444123).addEventLog(event, TEST_TOKEN, data);
    mockProvider.setCode(FROM, "0x1", 5444123);

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // In exploitation stage victims cases, the first call is to fetch the token price. Not adding a mock implementation for the rest of the calls implies that the tag ended up being fetched through the ERC20 token's symbol
        return Promise.resolve(
          new Response(
            JSON.stringify({
              "0x0000000000000000000000000000000000002222": { usd: 52354234 },
            })
          )
        );
      }
    });

    const TOKEN_IFACE = new Interface(TOKEN_ABI);

    mockProvider.addCallTo(TEST_TOKEN, 5444123, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [18],
    });

    mockProvider.addCallTo(FROM, 5444123, TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: ["HEY"],
    });
    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {
        "0x0000000000000000000000000000000000001234": {
          holders: [],
          protocolTwitter: "",
          protocolUrl: "",
          tag: "HEY",
          confidence: 0.4,
        },
      },
      preparationStage: {},
    });
  });

  it("should return an exploitation stage victim when its tag is found, exploited via an ERC20 Transfer when the USD value can't be fetched but the balance change is over 10% of the total supply", async () => {
    const TRANSFER_IFACE = new Interface([ERC20_TRANSFER_EVENT]);
    const TEST_TOKEN = createAddress("0x2222");
    const FROM = createAddress("0x1234");
    const TO = createAddress("0x5678");
    const event = TRANSFER_IFACE.getEvent("Transfer");
    const data = [FROM, TO, ethers.BigNumber.from("3424324324423423")];

    const mockTxEvent = new TestTransactionEvent().setBlock(5444123).addEventLog(event, TEST_TOKEN, data);
    mockProvider.setCode(FROM, "0x1", 5444123);

    const TOKEN_IFACE = new Interface(TOKEN_ABI);

    mockProvider.addCallTo(TEST_TOKEN, 5444123, TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: [ethers.BigNumber.from("4424324324423423")], // over 5% of the total supply
    });

    mockProvider.addCallTo(TEST_TOKEN, 5444123, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [18],
    });

    mockProvider.addCallTo(FROM, 5444123, TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: ["LpToken"],
    });
    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {
        "0x0000000000000000000000000000000000001234": {
          holders: [],
          protocolTwitter: "",
          protocolUrl: "",
          tag: "LpToken",
          confidence: 1,
        },
      },
      preparationStage: {},
    });
  });

  it("should return an exploitation stage victim when its tag is found, exploited via a native transfer", async () => {
    const FROM = createAddress("0x1234");
    const TO = createAddress("0x5678");

    const mockTxEvent: TestTransactionEventExtended = new TestTransactionEventExtended();

    mockTxEvent
      .addTraces2({
        from: FROM,
        to: TO,
        value: ethers.BigNumber.from("3242323423424324324423423").toString(),
        callType: "call",
      })
      .setBlock(51444123);
    mockProvider.setCode(FROM, "0x1", 51444123);

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // In exploitation stage victims cases, the first call is to fetch the token price. Not adding a mock implementation for the rest of the calls implies that the tag ended up being fetched through the ERC20 token's symbol
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ethereum: { usd: 9999 },
            })
          )
        );
      }
    });

    const TOKEN_IFACE = new Interface(TOKEN_ABI);

    mockProvider.addCallTo(FROM, 51444123, TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: ["AWW"],
    });
    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {
        "0x0000000000000000000000000000000000001234": {
          holders: [],
          protocolTwitter: "",
          protocolUrl: "",
          tag: "AWW",
          confidence: 1,
        },
      },
      preparationStage: {},
    });
  });

  it("should return two victims on the exploitation stage", async () => {
    const TRANSFER_IFACE = new Interface([ERC20_TRANSFER_EVENT]);
    const TEST_TOKEN = createAddress("0x2222");
    const FROM = createAddress("0x1234");
    const TO = createAddress("0x5678");
    const event = TRANSFER_IFACE.getEvent("Transfer");
    const data = [FROM, TO, ethers.BigNumber.from("3424324324423423")];

    const FROM_NATIVE = createAddress("0x4444");
    const TO_NATIVE = createAddress("0x3333");

    const mockTxEvent = new TestTransactionEventExtended()
      .addTraces2({
        from: FROM_NATIVE,
        to: TO_NATIVE,
        value: ethers.BigNumber.from("13242323423424324324423423").toString(),
        callType: "call",
      })
      .setBlock(99)
      .addEventLog(event, TEST_TOKEN, data);

    mockProvider.setCode(FROM, "0x1", 99);

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // First call to fetch the token's price
        return Promise.resolve(
          new Response(
            JSON.stringify({
              "0x0000000000000000000000000000000000002222": { usd: 752354234 },
            })
          )
        );
      } else if (callCount === 2) {
        // Mock a failed call to fetch the price of the same token for the case of the receiver of the ERC20 transfer, as it's not needed
        return Promise.reject(new Response());
      } else if (callCount === 3) {
        // Fetch the price of the native token in regards to the native token transfer
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ethereum: { usd: 19999 },
            })
          )
        );
      }
    });

    const TOKEN_IFACE = new Interface(TOKEN_ABI);

    mockProvider.addCallTo(TEST_TOKEN, 99, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [18],
    });

    // By not mocking any of the rest calls, the tag is fetched using the ERC20 token's symbol method.
    mockProvider.addCallTo(FROM, 99, TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: ["ERC20LostERC20"],
    });

    mockProvider.addCallTo(FROM_NATIVE, 99, TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: ["ERC20LostNative"],
    });
    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);
    expect(victims).toStrictEqual({
      exploitationStage: {
        "0x0000000000000000000000000000000000001234": {
          holders: [],
          protocolTwitter: "",
          protocolUrl: "",
          tag: "ERC20LostERC20",
          confidence: 1,
        },
        "0x0000000000000000000000000000000000004444": {
          holders: [],
          protocolTwitter: "",
          protocolUrl: "",
          tag: "ERC20LostNative",
          confidence: 1,
        },
      },
      preparationStage: {},
    });
  });

  it("should return victims both from the exploitation and the preparation stage", async () => {
    const TRANSFER_FROM = createAddress("0x1234");
    const TRANSFER_TO = createAddress("0x5678");
    const createdContractAddress = createAddress("0x789");
    const extractedAddress = createAddress("0x11888");

    mockAlertsResponse = {
      alerts: [
        {
          metadata: {
            address1: createAddress("0x1234"),
            address1again: createAddress("0x1234"),
            address2: createAddress("0x5678"),
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: {
          alertId: "1234",
          blockNumber: 0,
        },
      },
    };

    const mockTxEvent: TestTransactionEventExtended = new TestTransactionEventExtended();

    mockTxEvent
      .addTraces2({
        from: createAddress("0x123"),
        address: createdContractAddress,
        type: "create",
      })
      .addTraces2({
        from: TRANSFER_FROM,
        to: TRANSFER_TO,
        value: ethers.BigNumber.from("3242323423424324324423423").toString(),
        callType: "call",
      })
      .setFrom(createAddress("0x123"))
      .setBlock(122);

    mockProvider.addStorage(createdContractAddress, 0, 122, extractedAddress);
    mockProvider.setCode(extractedAddress, "0x1234", 122);

    for (let i = 1; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        122,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }
    mockProvider.setCode(TRANSFER_FROM, "0x1", 122);

    jest.mock("node-fetch");
    const fetch = require("node-fetch");
    const { Response } = jest.requireActual("node-fetch");

    let callCount = 0;
    fetch.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // Fetch the price of the native token in regards to the exploitation stage victim
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ethereum: { usd: 9999 },
            })
          )
        );
      } else if (callCount === 2) {
        // Fetch the price of the native token for the case of the receiver in order to keep the correct order of the calls (Alternatively, 3 [due to the retries] failed could have been used)
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ethereum: { usd: 9999 },
            })
          )
        );
      } else if (callCount === 3) {
        // Preparation Stage Victim: Call to Forta DB
        return Promise.resolve(
          new Response(
            JSON.stringify({
              events: [{ label: { label: "Victim5678" } }],
            })
          )
        );
      } else if (callCount === 4) {
        // Preparation Stage Victim: Call to the Ethplorer API
        return Promise.resolve(
          new Response(
            JSON.stringify({
              holders: [
                { address: createAddress("0x22aabb"), balance: 133, share: 28 },
                {
                  address: createAddress("0x33aabbcc"),
                  balance: 4233,
                  share: 228,
                },
              ],
            })
          )
        );
      } else if (callCount === 5) {
        // Exploitation Stage Victim: Failed call to Forta DB
        return Promise.reject(new Response());
      } else if (callCount === 6) {
        // Exploitation Stage Victim: Failed call to get the contract creator address
        return Promise.reject(new Response());
      } else if (callCount === 7) {
        // Exploitation Stage Victim: Failed call to get the token holders
        return Promise.reject(new Response());
      }
    });

    const TOKEN_IFACE = new Interface(TOKEN_ABI);

    mockProvider.addCallTo(TRANSFER_FROM, 122, TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: ["AWW"],
    });
    const victims = await victimIdentifier.getIdentifiedVictims(mockTxEvent);

    expect(victims).toStrictEqual({
      exploitationStage: {
        "0x0000000000000000000000000000000000001234": {
          holders: [],
          protocolTwitter: "",
          protocolUrl: "",
          tag: "AWW",
          confidence: 1,
        },
      },
      preparationStage: {
        "0x0000000000000000000000000000000000011888": {
          holders: ["0x000000000000000000000000000000000022aabb", "0x0000000000000000000000000000000033aabbcc"],
          protocolTwitter: "Victim5678Twitter",
          protocolUrl: "victim5678.org",
          tag: "Victim5678",
          confidence: 1,
        },
      },
    });
  });
});
