import { HandleTransaction, Log } from "forta-agent";
import { FindingGenerator } from "./utils";
export default function provideEventCheckerHandler(createFinding: FindingGenerator, eventSignature: string, address?: string, filter?: (log: Log, index?: number, array?: Log[]) => boolean): HandleTransaction;
