import { ethers } from "forta-agent";

export const wrappedNativeTokens: Record<number, string> = {
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  10: "0x4200000000000000000000000000000000000006",
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  137: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  //250: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
  //42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
};

// export const PREPARATION_STAGE_THRESHOLD = 5;

// //HandleTransaction Threshold
// export const INFO_FINDING_THRESHOLD = ethers.BigNumber.from(0);

// //HandleBlock Underlying Bots Threshold
// const MEDIUM_FINDING_THRESHOLD = 20000;
// const HIGH_FINDING_THRESHOLD = 100000;
// const CRITICAL_FINDING_THRESHOLD = 500000;

// export const getSeverity = (usdValue: number) => {
//   if (usdValue > CRITICAL_FINDING_THRESHOLD) {
//     return FindingSeverity.Critical;
//   } else if (usdValue > HIGH_FINDING_THRESHOLD) {
//     return FindingSeverity.High;
//   } else if (usdValue > MEDIUM_FINDING_THRESHOLD) {
//     return FindingSeverity.Medium;
//   } else return FindingSeverity.Low;
// };
export const PREPARATION_BOT = ["0x0b241032ca430d9c02eaa6a52d217bbff046f0d1b3f3d2aa928e42a97150ec91"]; // suspicious contract creation
export const SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";

export const ZERO = ethers.constants.Zero;
export const ERC20_TRANSFER_EVENT = "event Transfer(address indexed from, address indexed to, uint256 value)";
export const WRAPPED_NATIVE_TOKEN_EVENTS = [
  "event Deposit(address indexed to, uint256 value)",
  "event Withdrawal(address indexed from, uint256 value)",
];

export const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function name() public view returns (string)",
  "function decimals() external view returns (uint8)",
];

export const MKR_TOKEN_ABI = ["function symbol() external view returns (bytes32)"];
