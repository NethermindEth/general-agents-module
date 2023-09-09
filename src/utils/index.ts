import { ethers } from "forta-agent";
import NetworkManager from "./network.manager";
import { ProviderCache, ProviderCacheOptions } from "./provider.cache";
import CachedContract from "./cached.contract";
import { MulticallProvider, MulticallContract } from "./multicall.provider";
import VictimIdentifier from "./victim-identification/victim.identifier";

export const padAddress = (address: string) => ethers.utils.hexZeroPad(address, 20);
export const createAddress = (address: string) => padAddress(address).toLowerCase();
export const createChecksumAddress = (address: string): string => toChecksumAddress(padAddress(address));
export const toChecksumAddress = (address: string): string => ethers.utils.getAddress(address.toLowerCase());
export const createTransactionHash = (txParams: ethers.UnsignedTransaction): string => {
  const tx = ethers.utils.serializeTransaction(txParams);
  return ethers.utils.keccak256(tx);
};

export {
  NetworkManager,
  ProviderCache,
  ProviderCacheOptions,
  CachedContract,
  MulticallProvider,
  MulticallContract,
  VictimIdentifier,
};
