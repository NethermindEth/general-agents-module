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
var eth_transfers_1 = __importDefault(require("./eth.transfers"));
var tests_utils_1 = require("./tests.utils");
var utils_1 = require("./utils");
describe("ETH Transfer Agent Tests", function () {
    var handleTransaction;
    it("should returns empty findings if no threshold was specified and transactions are below 10 ETH", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator);
                    txEvent = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("9"));
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns empty findings if no threshold was specified and transactions are 10 ETH or more", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent1, findings, txEvent2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator);
                    txEvent1 = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("10"));
                    return [4 /*yield*/, handleTransaction(txEvent1)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)()]);
                    txEvent2 = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("100"));
                    return [4 /*yield*/, handleTransaction(txEvent2)];
                case 2:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)()]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns empty findings if value is under specified threshold", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator, { valueThreshold: (0, utils_1.toWei)("100") });
                    txEvent = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("99"));
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns findings if value is equal or greater to specified threshold ", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent1, findings, txEvent2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator, { valueThreshold: (0, utils_1.toWei)("100") });
                    txEvent1 = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("100"));
                    return [4 /*yield*/, handleTransaction(txEvent1)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)()]);
                    txEvent2 = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("1000"));
                    return [4 /*yield*/, handleTransaction(txEvent2)];
                case 2:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)()]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns empty findings if transaction are not from the specified address", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator, { from: (0, tests_utils_1.createAddress)("0x12") });
                    txEvent = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("15")).setFrom((0, tests_utils_1.createAddress)("0x13"));
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns findings if transactions are from the specified address", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator, { from: (0, tests_utils_1.createAddress)("0x12") });
                    txEvent = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("15")).setFrom((0, tests_utils_1.createAddress)("0x12"));
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)()]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns empty findings if transactions are not to specified address", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator, { to: (0, tests_utils_1.createAddress)("0x12") });
                    txEvent = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("15")).setTo((0, tests_utils_1.createAddress)("0x13"));
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns findings if transactions are to specified address", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator, { to: (0, tests_utils_1.createAddress)("0x12") });
                    txEvent = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("15")).setTo((0, tests_utils_1.createAddress)("0x12"));
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)()]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns findings only when all the specified conditions are met", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent1, findings, txEvent2, txEvent3, txEvent4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, eth_transfers_1.default)(tests_utils_1.generalTestFindingGenerator, {
                        from: (0, tests_utils_1.createAddress)("0x12"),
                        to: (0, tests_utils_1.createAddress)("0x13"),
                        valueThreshold: (0, utils_1.toWei)("50"),
                    });
                    txEvent1 = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("100")).setTo((0, tests_utils_1.createAddress)("0x13"));
                    return [4 /*yield*/, handleTransaction(txEvent1)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    txEvent2 = new tests_utils_1.TestTransactionEvent().setValue((0, utils_1.toWei)("100")).setFrom((0, tests_utils_1.createAddress)("0x12"));
                    return [4 /*yield*/, handleTransaction(txEvent2)];
                case 2:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    txEvent3 = new tests_utils_1.TestTransactionEvent()
                        .setValue((0, utils_1.toWei)("40"))
                        .setFrom((0, tests_utils_1.createAddress)("0x12"))
                        .setTo((0, tests_utils_1.createAddress)("0x13"));
                    return [4 /*yield*/, handleTransaction(txEvent3)];
                case 3:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    txEvent4 = new tests_utils_1.TestTransactionEvent()
                        .setValue((0, utils_1.toWei)("80"))
                        .setFrom((0, tests_utils_1.createAddress)("0x12"))
                        .setTo((0, tests_utils_1.createAddress)("0x13"));
                    return [4 /*yield*/, handleTransaction(txEvent4)];
                case 4:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)()]);
                    return [2 /*return*/];
            }
        });
    }); });
});
