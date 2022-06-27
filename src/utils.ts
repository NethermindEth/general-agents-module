import Web3EthAbi from "web3-eth-abi";
import { Finding } from "forta-agent";
import { AbiItem, stripHexPrefix } from "web3-utils";

export type metadataVault = { [key: string]: any };

export type FindingGenerator = (metadata?: metadataVault) => Finding;

export const encodeParameter = (type: any, value: any): string => Web3EthAbi.encodeParameter(type, value);

export const encodeParameters = (types: any[], values: any[]): string => Web3EthAbi.encodeParameters(types, values);

export const decodeParameter = (type: any, value: string): any => Web3EthAbi.decodeParameter(type, value);

export const decodeParameters = (types: any[], value: string): any => Web3EthAbi.decodeParameters(types, value);

export const stripFunctionSelector = (txData: string): string => stripHexPrefix(txData).slice(8);

export const extractFunctionSelector = (txData: string): string => txData.slice(0, 10);

export const decodeFunctionCallParameters = (types: any[], txData: string): any => {
  try {
    const encodedParameters: string = stripFunctionSelector(txData);
    return decodeParameters(types, encodedParameters);
  } catch {
    return undefined;
  }
};

export const encodeFunctionSignature = (functionsSignature: string | AbiItem): string =>
  Web3EthAbi.encodeFunctionSignature(functionsSignature);

export const encodeFunctionCall = (functionAbi: AbiItem, values: string[]): string =>
  Web3EthAbi.encodeFunctionCall(functionAbi, values);

export const encodeEventSignature = (functionAbi: string | AbiItem): string =>
  Web3EthAbi.encodeEventSignature(functionAbi);

export const extractArgumentTypes = (functionDefinition: string | AbiItem): any[] => {
  switch (typeof functionDefinition) {
    case "string":
      return extractTypesFromSignature(functionDefinition);

    default:
      return extractTypesFromAbiItem(functionDefinition);
  }
};

// TODO Improve for function with more complex types involving , (e.g. test(tuple(uint256, bool), bool))
const extractTypesFromSignature = (functionSignature: string): string[] => {
  const startOfArguments = functionSignature.indexOf("(");
  const argumentsString = functionSignature.slice(startOfArguments + 1, functionSignature.length - 1);

  return argumentsString === "" ? [] : argumentsString.split(",");
};

const extractTypesFromAbiItem = (functionDefinition: AbiItem): any[] => {
  return functionDefinition.inputs === undefined ? [] : functionDefinition.inputs;
};
