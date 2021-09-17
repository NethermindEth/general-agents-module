"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_1 = __importDefault(require("web3"));
var web3 = new web3_1.default();
var EVENT_SIGNATURE = "Transfer(address,address,uint256)";
var fromLogToTransferInfo = function (log) {
    return {
        to: web3.eth.abi.decodeParameter("address", log.topics[2]),
        from: web3.eth.abi.decodeParameter("address", log.topics[1]),
        amount: web3.eth.abi.decodeParameter("uint256", log.data),
    };
};
var createFilter = function (options) {
    if (options === undefined) {
        return function (_) { return true; };
    }
    return function (transferInfo) {
        if (options.from !== undefined && options.from !== transferInfo.from) {
            return false;
        }
        if (options.to !== undefined && options.to !== transferInfo.to) {
            return false;
        }
        if (options.amountThreshold !== undefined && BigInt(options.amountThreshold) > BigInt(transferInfo.amount)) {
            return false;
        }
        return true;
    };
};
function provideERC20TransferAgent(findingGenerator, tokenAddress, agentOptions) {
    var _this = this;
    var filterTransferInfo = createFilter(agentOptions);
    return function (txEvent) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, txEvent
                    .filterEvent(EVENT_SIGNATURE, tokenAddress)
                    .map(fromLogToTransferInfo)
                    .filter(filterTransferInfo)
                    .map(function (transferInfo) { return findingGenerator(transferInfo); })];
        });
    }); };
}
exports.default = provideERC20TransferAgent;
