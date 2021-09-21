import { TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";
interface TraceProps {
    to?: string;
    from?: string;
    input?: string;
}
export declare const generalTestFindingGenerator: FindingGenerator;
export declare const createAddress: (suffix: string) => string;
export declare class TestTransactionEvent extends TransactionEvent {
    constructor();
    setFrom(address: string): TestTransactionEvent;
    setTo(address: string): TestTransactionEvent;
    setValue(value: string): TestTransactionEvent;
    setData(data: string): TestTransactionEvent;
    setGasUsed(value: string): TestTransactionEvent;
    setStatus(status: boolean): TestTransactionEvent;
    addEventLog(eventSignature: string, address?: string, topics?: string[], data?: string): TestTransactionEvent;
    addInvolvedAddress(address: string): TestTransactionEvent;
    addTrace({ to, from, input }: TraceProps): TestTransactionEvent;
}
export {};
