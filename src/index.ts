import provideERC20TransferHandler from "./handler/erc20.transfers";
import provideETHTransferHandler from "./handler/eth.transfers";
import provideFunctionCallsDetectorHandler from "./handler/function.calls";
import provideEventCheckerHandler from "./handler/events.checker";
import provideBlacklistedAddressesHandler from "./handler/blacklisted.addresses";
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
