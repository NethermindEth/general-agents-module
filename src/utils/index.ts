
import { ethers } from "forta-agent";

export const createAddress = (addr: string) => ethers.utils.hexZeroPad(addr, 20);
