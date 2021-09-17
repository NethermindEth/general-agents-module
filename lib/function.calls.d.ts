import { HandleTransaction } from "forta-agent";
import { FindingGenerator } from "./utils";
interface AgentOptions {
    from?: string;
    to?: string;
}
export default function provideFunctionCallsDetectorAgent(findingGenerator: FindingGenerator, functionSignature: string, agentOptions?: AgentOptions): HandleTransaction;
export {};
