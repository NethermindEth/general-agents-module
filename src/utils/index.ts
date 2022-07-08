import { ethers } from "forta-agent";
import NetworkManager from "./network.manager";
import { ProviderCache, ProviderCacheOptions } from "./provider_cache";
import CachedContract from "./cached_contract";

export const padAddress = (address: string) => ethers.utils.hexZeroPad(address, 20);
export const createAddress = (address: string) => padAddress(address).toLowerCase();
export const createChecksumAddress = (address: string): string => toChecksumAddress(padAddress(address));
export const toChecksumAddress = (address: string): string => ethers.utils.getAddress(address.toLowerCase());

export { NetworkManager, ProviderCache, ProviderCacheOptions, CachedContract };
