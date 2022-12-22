import { when } from "jest-when";
import { ethers, Trace } from "forta-agent";
import AddressesExtractor from "./addresses.extractor";
import { MockEthersProvider, TestTransactionEvent } from "../../../test";
import { createAddress } from "../..";

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
}

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

describe("Addresses Extractor tests suite", () => {
  const mockProvider: MockEthersProviderExtended = new MockEthersProviderExtended();
  let addressExtractor: AddressesExtractor;

  beforeEach(() => {
    addressExtractor = new AddressesExtractor(mockProvider as any);
  });

  it("should return an empty set if there is no contract created", async () => {
    const mockTxEvent: TestTransactionEvent = new TestTransactionEvent();

    const addresses = await addressExtractor.extractAddresses(mockTxEvent);
    expect(addresses.size).toBe(0);
  });

  it("should return an empty set if there is a contract deployed but it doesn't contain any storage or opcode addresses", async () => {
    const mockTxEvent: TestTransactionEvent = new TestTransactionEvent().setTo("").setBlock(12100);

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";

    // Return no extracted addresses from storage
    for (let i = 0; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        12100,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }

    const addresses = await addressExtractor.extractAddresses(mockTxEvent);
    expect(addresses.size).toBe(0);
  });

  it("should return storage addresses correctly when there's no txEvent.to address defined", async () => {
    opcodesToReturn = [];
    const mockTxEvent: TestTransactionEvent = new TestTransactionEvent().setTo("").setBlock(100);

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";

    const extractedAddress1 = createAddress("0x888");
    const extractedAddress2 = createAddress("0x9999");

    // mock the provider's getStorageAt method to return the extracted addresses at the first storage slot of the created contract
    mockProvider.addStorage(createdContractAddress, 0, 100, extractedAddress1);
    mockProvider.setCode(extractedAddress1, "0x1234", 100);

    mockProvider.addStorage(createdContractAddress, 1, 100, extractedAddress2);
    mockProvider.setCode(extractedAddress2, "0x1234", 100);

    for (let i = 2; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        100,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }

    const addresses = await addressExtractor.extractAddresses(mockTxEvent);
    expect(addresses.size).toBe(2);
    expect(addresses.has(ethers.utils.getAddress(extractedAddress1))).toBeTruthy();
    expect(addresses.has(ethers.utils.getAddress(extractedAddress2))).toBeTruthy();
  });

  it("should return storage addresses correctly when there's a contract defined in the traces", async () => {
    opcodesToReturn = [];
    const mockTxEvent: TestTransactionEventExtended = new TestTransactionEventExtended();
    const createdContractAddress = createAddress("0x789");
    const extractedAddress1 = createAddress("0x11888");
    const extractedAddress2 = createAddress("0x11999");

    mockTxEvent
      .addTraces2({
        from: createAddress("0x123"),
        address: createdContractAddress,
        type: "create",
      })
      .setFrom(createAddress("0x123"))
      .setBlock(15500);

    // mock the provider's getStorageAt method to return the extracted addresses at the first storage slot of the created contract
    mockProvider.addStorage(createdContractAddress, 0, 15500, extractedAddress1);
    mockProvider.setCode(extractedAddress1, "0x1234", 15500);

    mockProvider.addStorage(createdContractAddress, 1, 15500, extractedAddress2);
    mockProvider.setCode(extractedAddress2, "0x1234", 15500);

    for (let i = 2; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        15500,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }

    const addresses = await addressExtractor.extractAddresses(mockTxEvent);
    expect(addresses.size).toBe(2);
    expect(addresses.has(ethers.utils.getAddress(extractedAddress1))).toBeTruthy();
    expect(addresses.has(ethers.utils.getAddress(extractedAddress2))).toBeTruthy();
  });

  it("should extract opcode addresses correctly", async () => {
    const mockTxEvent: TestTransactionEvent = new TestTransactionEvent().setTo("").setBlock(22100);

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";
    const opcodeExtractedAddress = createAddress("0x22222");
    opcodesToReturn = [{ pushData: opcodeExtractedAddress.slice(2) }];

    // Return no extracted addresses from storage
    for (let i = 0; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        22100,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }
    // get the code of the created contract to be able to extract the opcodes
    mockProvider.setCode(createdContractAddress, "0x12aa3456", 22100);
    // mock the provider's getCode method to return the USDC address as the first opcode
    mockProvider.setCode(opcodeExtractedAddress, "0x2112aa312", 22100);

    const addresses = await addressExtractor.extractAddresses(mockTxEvent);
    expect(addresses.size).toBe(1);
    expect(addresses.has(ethers.utils.getAddress(opcodeExtractedAddress))).toBeTruthy();
  });

  it("should return both storage and opcode addresses if both have been found", async () => {
    const mockTxEvent: TestTransactionEvent = new TestTransactionEvent().setTo("").setBlock(100);

    const createdContractAddress = "0xBd770416a3345F91E4B34576cb804a576fa48EB1";
    const extractedWETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const opcodeUSDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    opcodesToReturn = [{ pushData: "A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }]; // USDC address without the "0x" as it would have been returned from the evm's Buffer
    // mock the provider's getStorageAt method to return the WETH address at the first storage slot of the created contract
    mockProvider.addStorage(createdContractAddress, 0, 100, extractedWETHAddress);
    mockProvider.setCode(extractedWETHAddress, "0x1234", 100);

    for (let i = 1; i < 20; i++) {
      mockProvider.addStorage(
        createdContractAddress,
        i,
        100,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    }
    // get the code of the created contract to be able to extract the opcodes
    mockProvider.setCode(createdContractAddress, "0x123456", 100);
    // mock the provider's getCode method to return the USDC address as the first opcode
    mockProvider.setCode(opcodeUSDCAddress, "0x12345612312", 100);

    const addresses = await addressExtractor.extractAddresses(mockTxEvent);
    expect(addresses.size).toBe(2);
    expect(addresses.has(ethers.utils.getAddress(extractedWETHAddress))).toBeTruthy();
    expect(addresses.has(ethers.utils.getAddress(opcodeUSDCAddress))).toBeTruthy();
  });

  //   it("should return storage addresses", async () => {
  //     const address = "0x1234567890123456789012345678901234567890";
  //   });
});
