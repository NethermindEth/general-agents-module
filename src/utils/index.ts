import { ethers } from "forta-agent";
import NetworkManager from "./network.manager";

export const createAddress = (addr: string) => ethers.utils.hexZeroPad(addr, 20);

export { NetworkManager };
