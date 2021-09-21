import { HandleTransaction } from "forta-agent";
import { FindingGenerator } from "./utils";
declare type agentOptions = {
    from?: string;
    to?: string;
    valueThreshold?: string;
};
export default function provideETHTransferAgent(findingGenerator: FindingGenerator, agentOptions?: agentOptions): HandleTransaction;
export {};
