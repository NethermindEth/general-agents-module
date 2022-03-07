import provideERC20TransferHandler from "./erc20.transfers";
import provideETHTransferHandler from "./eth.transfers";
import provideFunctionCallsDetectorHandler from "./function.calls";
import provideEventCheckerHandler from "./events.checker";
import provideBlacklistedAddressesHandler from "./blacklisted.addresses";
import {
  FindingGenerator,
  encodeParameter,
  encodeParameters,
  encodeFunctionCall,
  decodeParameter,
  decodeParameters,
  decodeFunctionCallParameters,
  encodeFunctionSignature,
  encodeEventSignature,
} from "./utils";

export {
  provideERC20TransferHandler,
  provideETHTransferHandler,
  provideFunctionCallsDetectorHandler,
  provideEventCheckerHandler,
  provideBlacklistedAddressesHandler,
  encodeParameter,
  encodeParameters,
  encodeFunctionCall,
  decodeParameter,
  decodeParameters,
  decodeFunctionCallParameters,
  encodeEventSignature,
  encodeFunctionSignature,
  FindingGenerator,
};

export default {
  provideERC20TransferHandler,
  provideETHTransferHandler,
  provideFunctionCallsDetectorHandler,
  provideEventCheckerHandler,
  provideBlacklistedAddressesHandler,
  encodeParameter,
  encodeParameters,
  encodeFunctionCall,
  decodeParameter,
  decodeParameters,
  decodeFunctionCallParameters,
  encodeEventSignature,
  encodeFunctionSignature,
};
