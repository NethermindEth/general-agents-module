import { ethers } from "forta-agent";
import { MockEthersProvider } from "./tests";
import NetworkManager from "./network.manager";

enum Network {
  ETHEREUM_MAINNET = 1,
  POLYGON = 137,
  ARBITRUM = 42161,
}

describe("NetworkManager test suite", () => {
  describe("constructor", () => {
    it("should leave the network as -1 if no chainId was specified", () => {
      const networkManager = new NetworkManager({});

      expect(networkManager.getNetworkMap()).toStrictEqual({});
      expect(networkManager.getNetwork()).toStrictEqual(-1);
    });

    it("should check if the specified chainId is supported and throw errors accordingly", () => {
      const data = {
        [Network.ETHEREUM_MAINNET]: {
          test: "test",
        },
      };

      let networkManager: NetworkManager<{ test: string }>;

      expect(() => {
        networkManager = new NetworkManager(data, Network.ETHEREUM_MAINNET);
      }).not.toThrowError(`The network with ID ${Network.ETHEREUM_MAINNET} is not supported`);
      expect(networkManager!.getNetworkMap()).toStrictEqual(data);
      expect(networkManager!.getNetwork()).toStrictEqual(Network.ETHEREUM_MAINNET);

      expect(() => {
        networkManager = new NetworkManager(data, Network.POLYGON);
      }).toThrowError(`The network with ID ${Network.POLYGON} is not supported`);
    });
  });

  describe("init", () => {
    let provider: ethers.providers.Provider;
    let chainId: number;

    beforeAll(() => {
      chainId = Network.ETHEREUM_MAINNET;

      const mockProvider = new MockEthersProvider();
      // @ts-expect-error
      mockProvider.getNetwork = jest.fn().mockImplementation(() => ({ chainId }));

      provider = mockProvider as unknown as ethers.providers.Provider;
    });

    it("should check if the fetched chainId is supported and throw errors accordingly", async () => {
      const data = {
        [Network.ETHEREUM_MAINNET]: {
          test: "test",
        },
      };

      const networkManager = new NetworkManager(data);

      await expect(networkManager.init(provider)).resolves.toBeUndefined();
      expect(networkManager.getNetwork()).toStrictEqual(Network.ETHEREUM_MAINNET);

      chainId = Network.POLYGON;

      await expect(networkManager.init(provider)).rejects.toThrowError(
        `The network with ID ${chainId} is not supported`
      );
    });
  });

  describe("set network", () => {
    it("should check if the specified chainId is supported and throw errors accordingly", () => {
      const data = {
        [Network.ETHEREUM_MAINNET]: {
          test: "test",
        },
        [Network.POLYGON]: {
          test: "test",
        },
      };

      let networkManager = new NetworkManager(data);
      expect(() => {
        networkManager.setNetwork(Network.ETHEREUM_MAINNET);
      }).not.toThrowError(`The network with ID ${Network.ETHEREUM_MAINNET} is not supported`);
      expect(() => {
        networkManager.setNetwork(Network.POLYGON);
      }).not.toThrowError(`The network with ID ${Network.POLYGON} is not supported`);
      expect(() => {
        networkManager.setNetwork(Network.ARBITRUM);
      }).toThrowError(`The network with ID ${Network.ARBITRUM} is not supported`);
    });
  });

  describe("get", () => {
    it("should get the correct value for a key according to the network", () => {
      const data = {
        [Network.ETHEREUM_MAINNET]: {
          test: "Ethereum",
        },
        [Network.POLYGON]: {
          test: "Polygon",
        },
      };

      const networkManager = new NetworkManager(data, Network.ETHEREUM_MAINNET);

      expect(networkManager.get("test")).toStrictEqual("Ethereum");

      networkManager.setNetwork(Network.POLYGON);

      expect(networkManager.get("test")).toStrictEqual("Polygon");
    });
  });
});
