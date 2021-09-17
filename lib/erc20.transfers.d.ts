import { HandleTransaction } from "forta-agent";
import { FindingGenerator } from "./utils";
declare type agentOptions = {
    from?: string;
    to?: string;
    amountThreshold?: string;
};
export default function provideERC20TransferAgent(findingGenerator: FindingGenerator, tokenAddress: string, agentOptions?: agentOptions): HandleTransaction;
export {};
