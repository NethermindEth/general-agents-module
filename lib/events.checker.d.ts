import { HandleTransaction } from "forta-agent";
import { FindingGenerator } from "./utils";
export default function provideEventCheckerHandler(createFinding: FindingGenerator, eventSignature: string, address?: string): HandleTransaction;
