import { ethers } from "forta-agent";

export const MAX_USD_VALUE = 500000;

export const PREPARATION_BOT = ["0x9aaa5cd64000e8ba4fa2718a467b90055b70815d60351914cc1cbe89fe1c404c"]; // Malicious Contract Creation ML Bot v2
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
  "function totalSupply() external view returns (uint256)",
];

export const MKR_TOKEN_ABI = ["function symbol() external view returns (bytes32)"];

export const SAFE_TAGS = ["UNI-V2", "Uniswap", "spLP", "SLP", "KS2-RT", "PGL", "LBT", "JLP", "Cake-LP"];
