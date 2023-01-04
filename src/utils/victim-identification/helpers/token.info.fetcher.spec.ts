import { BigNumber, ethers } from "ethers";
import TokenInfoFetcher from "./token.info.fetcher";
import { TOKEN_ABI, MKR_TOKEN_ABI } from "./constants";
import { Interface } from "ethers/lib/utils";
import { MockEthersProvider } from "../../../test";
import { createAddress } from "../..";
import fetch from "node-fetch";

jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");

// [blockNumber, balance]
const TEST_BALANCES: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(1001)],
  [25, BigNumber.from(1000)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
  [50, BigNumber.from(240)],
];

// [blockNumber, symbol]
const TEST_SYMBOLS: [number, string][] = [
  [10, "AAA"],
  [20, "BBB"],
  [30, "CCC"],
  [40, "DDD"],
  [50, "EEE"],
];

// [blockNumber, name]
const TEST_NAMES: [number, string][] = [
  [10, "tokenAAA"],
  [20, "tokenBBB"],
  [30, "tokenCCC"],
  [40, "tokenDDD"],
  [50, "tokenEEE"],
];

// [blockNumber, name]
const TEST_DECIMALS: [number, number][] = [
  [10, 18],
  [20, 6],
  [30, 31],
  [40, 11],
  [50, 9],
];

// [blockNumber, token, totalSupply]
const TEST_TOTAL_SUPPLIES: [number, string, BigNumber][] = [
  [10, createAddress("0xa1"), BigNumber.from(100)],
  [20, createAddress("0xa2"), BigNumber.from(1000)],
  [30, createAddress("0xa3"), BigNumber.from(10000)],
  [40, createAddress("0xa4"), BigNumber.from(100000)],
  [50, createAddress("0xa5"), BigNumber.from(1000000)],
];

const TEST_BLOCK = 120;
const PROTOCOL_ADDRESS = createAddress("0xa1");
const tokenAddress = createAddress("0xa2");
const TOKEN_IFACE = new Interface(TOKEN_ABI);
const MKR_TOKEN_IFACE = new Interface(MKR_TOKEN_ABI);

describe("TokenInfoFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: TokenInfoFetcher;

  beforeAll(() => {
    fetcher = new TokenInfoFetcher(mockProvider as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch balance and use cache correctly", async () => {
    for (let [block, balance] of TEST_BALANCES) {
      mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "balanceOf", {
        inputs: [PROTOCOL_ADDRESS],
        outputs: [balance],
      });
      const fetchedBalance = await fetcher.getBalance(block, PROTOCOL_ADDRESS, tokenAddress);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(6);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, balance] of TEST_BALANCES) {
      const fetchedBalance = await fetcher.getBalance(block, PROTOCOL_ADDRESS, tokenAddress);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(6);
    mockProvider.clear();
  });

  it("should fetch total supply and use cache correctly", async () => {
    for (let [block, token, totalSupply] of TEST_TOTAL_SUPPLIES) {
      mockProvider.addCallTo(token, block, TOKEN_IFACE, "totalSupply", {
        inputs: [],
        outputs: [totalSupply],
      });

      const fetchedTotalSupply = await fetcher.getTotalSupply(block, token);
      expect(fetchedTotalSupply).toStrictEqual(totalSupply);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, token, totalSupply] of TEST_TOTAL_SUPPLIES) {
      const fetchedTotalSupply = await fetcher.getTotalSupply(block, token);
      expect(fetchedTotalSupply).toStrictEqual(totalSupply);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    mockProvider.clear();
  });

  it("should fetch ERC20 and native token symbol and use cache correctly", async () => {
    const chainId = 1;
    for (let [block, symbol] of TEST_SYMBOLS) {
      mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "symbol", {
        inputs: [],
        outputs: [symbol],
      });
      const fetchedSymbol = await fetcher.getSymbolOrName(chainId, block, tokenAddress);
      expect(fetchedSymbol).toStrictEqual(symbol);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // Native
    const fetchedSymbol = await fetcher.getSymbolOrName(chainId, TEST_BLOCK, "native");
    expect(fetchedSymbol).toStrictEqual("ETH");

    // MKR-like
    mockProvider.addCallTo(tokenAddress, TEST_BLOCK, MKR_TOKEN_IFACE, "symbol", {
      inputs: [],
      outputs: [ethers.utils.formatBytes32String("MKR")],
    });
    const mkrLikefetchedSymbol = await fetcher.getSymbolOrName(chainId, TEST_BLOCK, tokenAddress);
    expect(mkrLikefetchedSymbol).toStrictEqual("MKR");

    // Fetching name if symbol is not defined
    mockProvider.addCallTo(createAddress("0x1234"), TEST_BLOCK, TOKEN_IFACE, "name", {
      inputs: [],
      outputs: [TEST_NAMES[0][1]],
    });
    const fetchedName = await fetcher.getSymbolOrName(chainId, TEST_BLOCK, createAddress("0x1234"));
    expect(fetchedName).toStrictEqual(TEST_NAMES[0][1]);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, symbol] of TEST_SYMBOLS) {
      const fetchedSymbol = await fetcher.getSymbolOrName(chainId, block, tokenAddress);
      expect(fetchedSymbol).toStrictEqual(symbol);
    }
  });

  it("should fetch token name and use cache correctly", async () => {
    for (let [block, name] of TEST_NAMES) {
      mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "name", {
        inputs: [],
        outputs: [name],
      });
      const fetchedName = await fetcher.getName(block, tokenAddress);
      expect(fetchedName).toStrictEqual(name);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, name] of TEST_NAMES) {
      const fetchedName = await fetcher.getName(block, tokenAddress);
      expect(fetchedName).toStrictEqual(name);
    }
  });

  it("should fetch token decimals and use cache correctly", async () => {
    for (let [block, decimals] of TEST_DECIMALS) {
      mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "decimals", {
        inputs: [],
        outputs: [decimals],
      });
      const fetchedDecimals = await fetcher.getDecimals(block, tokenAddress);
      expect(fetchedDecimals).toStrictEqual(decimals);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, decimals] of TEST_DECIMALS) {
      const fetchedDecimals = await fetcher.getDecimals(block, tokenAddress);
      expect(fetchedDecimals).toStrictEqual(decimals);
    }
  });

  it("should fetch the value in USD correctly", async () => {
    const chainId = 1;

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ethereum: { usd: 1.2 } })));

    const fetchedNativeValue = await fetcher.getValueInUsd(TEST_BLOCK, chainId, "2000000000000000000", "native");
    expect(fetchedNativeValue).toStrictEqual(2.4);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ "0x00000000000000000000000000000000000000a2": { usd: 3 } }))
    );

    mockProvider.addCallTo(tokenAddress, TEST_BLOCK, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [18],
    });
    const fetchedTokenValue = await fetcher.getValueInUsd(TEST_BLOCK, chainId, "4000000000000000000", tokenAddress);
    expect(fetchedTokenValue).toStrictEqual(12);
  });

  it("should fetch the token holders correctly", async () => {
    const nativeHolders = await fetcher.getHolders("native", "Tag");
    expect(nativeHolders).toStrictEqual([]);

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            positions: [{ owner: createAddress("0xffaabb") }, { owner: createAddress("0xffaabbcc") }],
          },
        })
      )
    );

    const uniswapV3Holders = await fetcher.getHolders(tokenAddress, "Uniswap V3");
    expect(uniswapV3Holders).toStrictEqual([createAddress("0xffaabb"), createAddress("0xffaabbcc")]);

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          holders: [
            { address: createAddress("0xaabb"), balance: 33, share: 28 },
            { address: createAddress("0xaabbcc"), balance: 233, share: 228 },
          ],
        })
      )
    );

    const erc20Holders = await fetcher.getHolders(tokenAddress, "Not Uniswap V3");
    expect(erc20Holders).toStrictEqual([createAddress("0xaabb"), createAddress("0xaabbcc")]);
  });
});
