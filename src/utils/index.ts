import { ethers } from "forta-agent";
import NetworkManager from "./network.manager";
import { CachedProvider, CachedProviderOptions } from "./cached_provider";
import CachedContract from "./cached_contract";

export const padAddress = (address: string) => ethers.utils.hexZeroPad(address, 20);
export const createAddress = (address: string) => padAddress(address).toLowerCase();
export const createChecksumAddress = (address: string): string => toChecksumAddress(padAddress(address));
export const toChecksumAddress = (address: string): string => ethers.utils.getAddress(address.toLowerCase());

export { NetworkManager, CachedProvider, CachedProviderOptions, CachedContract };
