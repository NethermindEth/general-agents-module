"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestTransactionEvent = exports.createAddress = exports.generalTestFindingGenerator = void 0;
var web3_1 = __importDefault(require("web3"));
var forta_agent_1 = require("forta-agent");
var utils_1 = require("forta-agent/dist/sdk/utils");
var generalTestFindingGenerator = function () {
    return forta_agent_1.Finding.fromObject({
        name: "Finding Test",
        description: "Finding for test",
        alertId: "TEST",
        severity: forta_agent_1.FindingSeverity.Low,
        type: forta_agent_1.FindingType.Unknown,
    });
};
exports.generalTestFindingGenerator = generalTestFindingGenerator;
var createAddress = function (suffix) {
    return web3_1.default.utils.leftPad(suffix, 40);
};
exports.createAddress = createAddress;
var TestTransactionEvent = /** @class */ (function (_super) {
    __extends(TestTransactionEvent, _super);
    function TestTransactionEvent() {
        var _this = this;
        var transaction = {
            data: "",
            from: (0, exports.createAddress)("0x0"),
            to: (0, exports.createAddress)("0x1"),
            value: "0",
        };
        var receipt = {
            gasUsed: "1000000",
            logs: [],
            status: true,
        };
        var block = {};
        _this = _super.call(this, forta_agent_1.EventType.BLOCK, forta_agent_1.Network.MAINNET, transaction, receipt, [], {}, block) || this;
        return _this;
    }
    TestTransactionEvent.prototype.setFrom = function (address) {
        this.transaction.from = address;
        return this;
    };
    TestTransactionEvent.prototype.setTo = function (address) {
        this.transaction.to = address;
        return this;
    };
    TestTransactionEvent.prototype.setValue = function (value) {
        this.transaction.value = value;
        return this;
    };
    TestTransactionEvent.prototype.setData = function (data) {
        this.transaction.data = data;
        return this;
    };
    TestTransactionEvent.prototype.setGasUsed = function (value) {
        this.receipt.gasUsed = value;
        return this;
    };
    TestTransactionEvent.prototype.setStatus = function (status) {
        this.receipt.status = status;
        return this;
    };
    TestTransactionEvent.prototype.addEventLog = function (eventSignature, address, topics, data) {
        if (address === void 0) { address = (0, exports.createAddress)("0x0"); }
        if (topics === void 0) { topics = []; }
        if (data === void 0) { data = ""; }
        this.receipt.logs.push({
            address: address,
            topics: __spreadArray([(0, utils_1.keccak256)(eventSignature)], topics, true),
            data: data,
        });
        return this;
    };
    TestTransactionEvent.prototype.addInvolvedAddress = function (address) {
        this.addresses[address] = true;
        return this;
    };
    TestTransactionEvent.prototype.addTrace = function (_a) {
        var to = _a.to, from = _a.from, input = _a.input;
        var trace = {
            action: {
                to: to,
                from: from,
                input: input,
            },
        };
        this.traces.push(trace);
        return this;
    };
    return TestTransactionEvent;
}(forta_agent_1.TransactionEvent));
exports.TestTransactionEvent = TestTransactionEvent;
