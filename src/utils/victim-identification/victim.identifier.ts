import { ethers, TransactionEvent, getAlerts } from "forta-agent";
import { AlertsResponse } from "forta-agent/dist/sdk/graphql/forta";
import LRU from "lru-cache";
import fetch from "node-fetch";
import AddressesExtractor from "./helpers/addresses.extractor";
import {
  ERC20_TRANSFER_EVENT,
  PREPARATION_BOT,
  wrappedNativeTokens,
  WRAPPED_NATIVE_TOKEN_EVENTS,
  ZERO,
} from "./helpers/constants";
import TokenInfoFetcher from "./helpers/token.info.fetcher";
import {
  urlAndTwitterFetcher,
  getLuabaseChainByChainId,
  fetchLuabaseDb,
  getContractCreator,
  getContractName,
} from "./helpers/helper";

export default class VictimIdentifier extends TokenInfoFetcher {
  addressesExtractor: AddressesExtractor;
  private init: boolean;
  private protocols: string[][];
  private victimOccurences: Record<string, number>;
  private isContractCache: LRU<string, boolean>;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    super(provider);
    this.addressesExtractor = new AddressesExtractor(provider);
    this.init = false;
    this.protocols = [];
    this.getProtocols();
    this.victimOccurences = {};
    this.isContractCache = new LRU<string, boolean>({ max: 10000 });
  }

  private getProtocols = async () => {
    const response = (await (await fetch("https://api.llama.fi/protocols")).json()) as any;
    response.forEach((protocol: any) => {
      this.protocols.push([protocol.slug, protocol.url, protocol.twitter]);
    });
  };

  private getExploitationStageVictims = async (txEvent: TransactionEvent) => {
    const balanceChangesMap: Map<string, Record<string, ethers.BigNumber>> = new Map();

    const erc20TransferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT).filter((event) => !event.args.value.eq(ZERO));
    let events = erc20TransferEvents;
    if (txEvent.network in wrappedNativeTokens) {
      const wrappedTokenEvents = txEvent
        .filterLog(WRAPPED_NATIVE_TOKEN_EVENTS, wrappedNativeTokens[txEvent.network])
        .filter((event) => !event.args.value.eq(ZERO));
      events = events.concat(wrappedTokenEvents);
    }

    await Promise.all(
      events.map(async (event) => {
        const token = event.address;
        let { from, to, value } = event.args;
        if (!from) {
          from = wrappedNativeTokens[txEvent.network];
        }
        let isFromContract = this.isContractCache.get(from);
        if (isFromContract === undefined) {
          isFromContract = (await this.provider.getCode(from)) !== "0x";
          if (isFromContract) {
            this.isContractCache.set(from, true);
          }
        }

        // Update the balances map for 'from'
        if (balanceChangesMap.has(from)) {
          let currentEntry = balanceChangesMap.get(from);
          currentEntry![token] = (currentEntry![token] || ZERO).sub(value);
          balanceChangesMap.set(from, currentEntry!);
        } else if (isFromContract) {
          balanceChangesMap.set(from, { [token]: value.mul(-1) });
        }

        if (!to) {
          to = wrappedNativeTokens[txEvent.network];
        }
        let isToContract = this.isContractCache.get(to);
        if (isToContract === undefined) {
          isToContract = (await this.provider.getCode(to)) !== "0x";
          if (isToContract) {
            this.isContractCache.set(to, true);
          }
        }

        if (balanceChangesMap.has(to)) {
          let currentEntry = balanceChangesMap.get(to);
          currentEntry![token] = (currentEntry![token] || ZERO).add(value);
          balanceChangesMap.set(to, currentEntry!);
        } else if (isToContract) {
          balanceChangesMap.set(to, { [token]: value });
        }
      })
    );

    await Promise.all(
      txEvent.traces.map(async (trace) => {
        let { from, to, value, callType } = trace.action;

        if (value && value !== "0x0" && callType === "call") {
          from = ethers.utils.getAddress(from);
          to = ethers.utils.getAddress(to);
          const bnValue = ethers.BigNumber.from(value);
          // Determine whether 'from' and 'to' are contracts
          let isFromContract = this.isContractCache.get(from);
          if (isFromContract === undefined) {
            isFromContract = (await this.provider.getCode(from)) !== "0x";
            if (isFromContract) {
              this.isContractCache.set(from, true);
            }
          }
          let isToContract = this.isContractCache.get(to);
          if (isToContract === undefined) {
            isToContract = (await this.provider.getCode(to)) !== "0x";
            if (isToContract) {
              this.isContractCache.set(to, true);
            }
          }
          // Update the native token balance for the from address
          if (balanceChangesMap.has(from)) {
            let currentEntry = balanceChangesMap.get(from);
            currentEntry!["native"] = (currentEntry!["native"] || ZERO).sub(bnValue);
            balanceChangesMap.set(from, currentEntry!);
          } else if (isFromContract) {
            balanceChangesMap.set(from, { ["native"]: bnValue.mul(-1) });
          }
          // Update the native token balance for the to address
          if (balanceChangesMap.has(to)) {
            let currentEntry = balanceChangesMap.get(to);
            currentEntry!["native"] = (currentEntry!["native"] || ZERO).add(bnValue);
            balanceChangesMap.set(to, currentEntry!);
          } else if (isToContract) {
            balanceChangesMap.set(to, { ["native"]: bnValue });
          }
        }
      })
    );

    // Remove empty records
    balanceChangesMap.forEach((record: Record<string, ethers.BigNumber>, key: string) => {
      Object.keys(record).forEach((token) => {
        if (record[token].eq(ZERO)) {
          delete record[token];
        }
      });
      if (Object.keys(record).length === 0) {
        balanceChangesMap.delete(key);
      }
    });
    const balanceChangesMapUsd: Map<string, Record<string, number>> = new Map();
    // Get the USD value of the balance changes
    await Promise.all(
      Array.from(balanceChangesMap.entries()).map(async ([key, record]) => {
        const usdRecord: Record<string, number> = {};
        await Promise.all(
          Object.keys(record).map(async (token) => {
            const UsdValue = await this.getValueInUsd(
              txEvent.blockNumber,
              txEvent.network,
              record[token].toString(),
              token
            );
            usdRecord[token] = UsdValue;
          })
        );
        balanceChangesMapUsd.set(key, usdRecord);
      })
    );

    const victims: string[] = [];
    balanceChangesMapUsd.forEach((record: Record<string, number>, key: string) => {
      const sum = Object.values(record).reduce((acc, value) => {
        return acc + value;
      }, 0);
      // If the sum of the values is less than -100 USD, add the address to the victims list
      if (sum < -100) {
        victims.push(key);
      }
    });

    return victims;
  };

  // Get the number of occurences of the victims in previously deployed contracts code
  private getVictimOccurences = async (txEvent: TransactionEvent) => {
    const { network: chainId, blockNumber } = txEvent;
    let blockNumberRange;

    if (!this.init) {
      this.init = true;
      blockNumberRange = {
        startBlockNumber: 0,
        endBlockNumber: blockNumber,
      };
    } else {
      blockNumberRange = {
        startBlockNumber: blockNumber,
        endBlockNumber: blockNumber,
      };
    }

    let startingCursor;
    // Set the number of retries
    let retries = 5;
    //Loop until the startingCursor.blockNumber is 0 or until the retries are exhausted
    while ((!startingCursor || startingCursor.blockNumber > 0) && retries > 0) {
      try {
        // Attempt to get the preparation stage alerts
        const preparationStageAlerts: AlertsResponse = await getAlerts({
          botIds: PREPARATION_BOT,
          chainId: chainId,
          blockNumberRange: blockNumberRange,
          first: 6000,
          startingCursor: startingCursor,
        });

        // Loop through the preparation stage alerts, and extract the addresses contained in the metadata
        preparationStageAlerts.alerts.forEach((alert) => {
          if (alert.metadata) {
            const values: string[] = Object.values(alert.metadata);
            const victimContracts: string[] = values.filter((value: string) => value.startsWith("0x"));
            victimContracts.forEach((victim: string) => {
              this.victimOccurences[victim] = this.victimOccurences[victim] ? ++this.victimOccurences[victim] : 1;
            });
          }
        });
        startingCursor = preparationStageAlerts.pageInfo.endCursor;
      } catch (error) {
        // Decrement the number of retries left
        retries--;

        // If retries is greater than 0, retry the operation
        if (retries > 0) {
          continue;
        }
      }
    }

    return this.victimOccurences;
  };

  private identifyVictims = async (victims: string[], chainId: number, blockNumber: number) => {
    let identifiedVictims: Record<
      string,
      { protocolUrl: string; protocolTwitter: string; tag: string; holders: string[] }
    > = {};

    // Retrieve the tag for the possible victim contract address
    const chain = getLuabaseChainByChainId(chainId);
    for (const victim of victims) {
      // Process the promises one by one instead of using Promise.all to maintain the order
      const result = await (async () => {
        let tag: string = "";

        // Attempt to fetch the tag from the Luabase database
        tag = await fetchLuabaseDb(victim.toLowerCase(), chain);
        // If an error occurs, check if the victim is a contract
        if (!tag) {
          const contractCreator = await getContractCreator(victim.toLowerCase(), chainId);

          // If the victim is a contract, try to fetch the tag from the Luabase database using the contract creator
          if (contractCreator) {
            tag = await fetchLuabaseDb(contractCreator, chain);
            // If the tag ends with "Deployer", extract the name before the colon
            if (tag.endsWith("Deployer")) {
              tag = tag.split(":")[0];
            }
          }

          // If the tag was still not found, try to fetch it from the Ethereum Lists database
          if (!tag) {
            try {
              const ethereumListsDbResponse = (await (
                await fetch(
                  `https://raw.githubusercontent.com/ethereum-lists/contracts/main/contracts/${chainId}/${ethers.utils.getAddress(
                    victim
                  )}.json`
                )
              ).json()) as any;
              tag = ethereumListsDbResponse.project;
            } catch {
              // If an error occurs, try to fetch the tag using the ERC20 'symbol' or 'name' methods
              tag = await this.getSymbolOrName(chainId, blockNumber, victim.toLowerCase());

              // If the tag is "Not Found", try to fetch the contract name
              if (tag === "Not Found") {
                tag = await getContractName(victim, chainId);
              }
            }
          }
        }
        // Skip transaction for certain tags
        if (
          tag === "Not Found" ||
          tag === "" || // 0x227ad7bdeaefa4f23da290d19f17705949b65923e334b66288de5d6329e599c3
          tag.startsWith("MEV") ||
          tag.startsWith("Null") ||
          tag.startsWith("Fund") || // 0xa294cca691e4c83b1fc0c8d63d9a3eef0a196de1
          tag.split(" ").includes("Hack") || // 0x1b4d1e3318b1bffca9562b7aca468009d971d59848b6c0672dd1600d481693b6
          tag.split(" ").includes("Exploiter")
        ) {
          return;
        }
        let [protocolUrl, protocolTwitter] = urlAndTwitterFetcher(this.protocols, tag);
        if (protocolUrl === "" && protocolTwitter === "") {
          [protocolUrl, protocolTwitter] = urlAndTwitterFetcher(
            this.protocols,
            await this.getName(blockNumber, victim.toLowerCase())
          );
        }
        const holders = await this.getHolders(victim, false, tag);

        return {
          protocolUrl,
          protocolTwitter,
          tag,
          holders,
        };
      })();

      if (result !== undefined) {
        identifiedVictims[victim] = result;
      }
    }
    return identifiedVictims;
  };

  public getIdentifiedVictims = async (txEvent: TransactionEvent) => {
    const { network: chainId, blockNumber } = txEvent;
    if (blockNumber !== this.latestBlockNumber) {
      this.victimOccurences = await this.getVictimOccurences(txEvent);
      this.latestBlockNumber = blockNumber;
    }

    // Fetch addresses extracted from newly deployed contracts
    const extractedAddresses = await this.addressesExtractor.extractAddresses(txEvent);
    const sortedRecord: Record<string, number> = {};
    for (const victim of Array.from(extractedAddresses)) {
      sortedRecord[victim] = this.victimOccurences.hasOwnProperty(victim) ? this.victimOccurences[victim] : 0;
    }
    const sortedPreparationStageVictims: Record<string, number> = Object.fromEntries(
      Object.entries(sortedRecord).sort((a, b) => a[1] - b[1])
    );

    // Fetch potential victims on the exploitation stage
    const exploitationStageVictims = await this.getExploitationStageVictims(txEvent);

    const victimsToProcess = Array.from(
      new Set([...exploitationStageVictims, ...Object.keys(sortedPreparationStageVictims)])
    );
    const victims = await this.identifyVictims(victimsToProcess, chainId, blockNumber);

    return victims;
  };
}
