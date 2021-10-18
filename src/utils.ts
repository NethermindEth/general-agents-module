import Web3 from "web3";
import { Finding } from "forta-agent";
import { AbiItem, stripHexPrefix } from "web3-utils";

const web3: Web3 = new Web3();

export type metadataVault = { [key: string]: any };

export type FindingGenerator = (metadata?: metadataVault) => Finding;

export const encodeParameter = (type: any, value: any): string => web3.eth.abi.encodeParameter(type, value);

export const encodeParameters = (types: any[], values: any[]): string => web3.eth.abi.encodeParameters(types, values);

export const decodeParameter = (type: any, value: string): any => web3.eth.abi.decodeParameter(type, value);

export const decodeParameters = (types: any[], value: string): any => web3.eth.abi.decodeParameters(types, value);

export const stripFunctionSelector = (txData: string): string => stripHexPrefix(txData).slice(8); 

export const decodeFunctionCallParameters = (types: any[], txData: string): any => {
  const encodedParameters: string = stripFunctionSelector(txData); 
  return decodeParameters(types, encodedParameters);
};

export const encodeFunctionSignature = (functionsSignature: string | AbiItem): string => web3.eth.abi.encodeFunctionSignature(functionsSignature);

export const encodeFunctionCall = (functionAbi: AbiItem, values: string[]): string => web3.eth.abi.encodeFunctionCall(functionAbi, values);

export const encodeEventSignature = (functionAbi: string | AbiItem): string => web3.eth.abi.encodeEventSignature(functionAbi);
