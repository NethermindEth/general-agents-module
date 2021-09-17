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
var tests_utils_1 = require("./tests.utils");
var events_checker_1 = __importDefault(require("./events.checker"));
var EVENT_SIGNATURE = "testSignature(bool,address)";
describe("Event Checker Agent Tests", function () {
    var transactionHandler;
    it("should returns empty findings if expected event is not found", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transactionHandler = (0, events_checker_1.default)(tests_utils_1.generalTestFindingGenerator, EVENT_SIGNATURE);
                    txEvent = new tests_utils_1.TestTransactionEvent().addEventLog("badSignature", "0x121212");
                    return [4 /*yield*/, transactionHandler(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns empty findings if the event wasn't emitted from the correct address", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transactionHandler = (0, events_checker_1.default)(tests_utils_1.generalTestFindingGenerator, EVENT_SIGNATURE, "0x131313");
                    txEvent = new tests_utils_1.TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x1212");
                    return [4 /*yield*/, transactionHandler(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns a finding if expected event was emitted from the correct address", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transactionHandler = (0, events_checker_1.default)(tests_utils_1.generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");
                    txEvent = new tests_utils_1.TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");
                    return [4 /*yield*/, transactionHandler(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)(txEvent)]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns findings every time the expected event is emitted from any address if no address was specified", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent1, findings, txEvent2, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    transactionHandler = (0, events_checker_1.default)(tests_utils_1.generalTestFindingGenerator, EVENT_SIGNATURE);
                    txEvent1 = new tests_utils_1.TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");
                    return [4 /*yield*/, transactionHandler(txEvent1)];
                case 1:
                    findings = _c.sent();
                    txEvent2 = new tests_utils_1.TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x131313");
                    _b = (_a = findings).concat;
                    return [4 /*yield*/, transactionHandler(txEvent2)];
                case 2:
                    findings = _b.apply(_a, [_c.sent()]);
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)(txEvent1), (0, tests_utils_1.generalTestFindingGenerator)(txEvent2)]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should returns findings only when then event is emitted from the correct address", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent1, findings, txEvent2, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    transactionHandler = (0, events_checker_1.default)(tests_utils_1.generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");
                    txEvent1 = new tests_utils_1.TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");
                    return [4 /*yield*/, transactionHandler(txEvent1)];
                case 1:
                    findings = _c.sent();
                    txEvent2 = new tests_utils_1.TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x131313");
                    _b = (_a = findings).concat;
                    return [4 /*yield*/, transactionHandler(txEvent2)];
                case 2:
                    findings = _b.apply(_a, [_c.sent()]);
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)(txEvent1)]);
                    return [2 /*return*/];
            }
        });
    }); });
});
