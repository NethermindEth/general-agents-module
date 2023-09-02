import { ethers } from "forta-agent";

export const createTransactionHash = (txParams: ethers.UnsignedTransaction): string => {
  const tx = ethers.utils.serializeTransaction(txParams);
  return ethers.utils.keccak256(tx);
};
