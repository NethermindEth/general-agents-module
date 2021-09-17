/// <reference types="bn.js" />
import { Finding } from "forta-agent";
declare type metadataVault = {
    [key: string]: any;
};
export declare type FindingGenerator = (metadata?: metadataVault) => Finding;
export declare const toWei: {
    (val: import("bn.js"), unit?: import("web3-utils").Unit | undefined): import("bn.js");
    (val: string, unit?: import("web3-utils").Unit | undefined): string;
};
export {};
