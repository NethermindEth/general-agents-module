import { Finding } from "forta-agent";
import Web3 from "web3";
import { AbiItem } from "web3-utils";

const web3: Web3 = new Web3();

export type metadataVault = { [key: string]: any };

export type FindingGenerator = (metadata?: metadataVault) => Finding;

export const toWei = Web3.utils.toWei;

export const encodeParameter = (type: string, value: string): string => web3.eth.abi.encodeParameter(type, value) as any;

export const encodeParameters = (types: string[], values: string[]): string => web3.eth.abi.encodeParameters(types, values) as any;

export const decodeParameter = (type: string, value: string): any => web3.eth.abi.decodeParameter(type, value);

export const decodeParameters = (types: string[], value: string): any => web3.eth.abi.decodeParameter(types, value);

const stripFunctionSelector = (txData: string): string => web3.utils.stripHexPrefix(txData).slice(8); 

export const decodeParameteresFromFunctionCall = (types: string[], txData: string): any => {
  const encodedParameters: string = stripFunctionSelector(txData); 
  return decodeParameters(types, encodedParameters);
}

export const getFunctionSelector = (functionsSignature: string | AbiItem): string => web3.eth.abi.encodeFunctionSignature(functionsSignature);

export const encodeFunctionCall = (functionAbi: AbiItem, values: string[]): string => web3.eth.abi.encodeFunctionCall(functionAbi, values);


