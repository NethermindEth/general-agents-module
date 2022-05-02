
import provideERC20TransferHandler from "./erc20.transfers";
import provideETHTransferHandler from "./eth.transfers";
import provideFunctionCallsDetectorHandler from "./function.calls";
import provideEventCheckerHandler from "./events.checker";
import provideBlacklistedAddressesHandler from "./blacklisted.addresses";

export {
    provideERC20TransferHandler,
    provideETHTransferHandler,
    provideFunctionCallsDetectorHandler,
    provideEventCheckerHandler,
    provideBlacklistedAddressesHandler,
};
