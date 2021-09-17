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
var forta_agent_1 = require("forta-agent");
var tests_utils_1 = require("./tests.utils");
var web3_1 = __importDefault(require("web3"));
var function_calls_1 = __importDefault(require("./function.calls"));
var abi = new web3_1.default().eth.abi;
describe("Function calls detector Agent Tests", function () {
    var handleTransaction;
    it("Should returns empty findings if the expected function wasn't called", function () { return __awaiter(void 0, void 0, void 0, function () {
        var txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleTransaction = (0, function_calls_1.default)(tests_utils_1.generalTestFindingGenerator, "Func()");
                    txEvent = new tests_utils_1.TestTransactionEvent();
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should returns a findings only if the function is called in the contract target `to`", function () { return __awaiter(void 0, void 0, void 0, function () {
        var signature, selector, txEvent1, findings, txEvent2, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    signature = "Func()";
                    selector = abi.encodeFunctionSignature(signature);
                    handleTransaction = (0, function_calls_1.default)(tests_utils_1.generalTestFindingGenerator, signature, {
                        to: (0, tests_utils_1.createAddress)("0x0"),
                    });
                    txEvent1 = new tests_utils_1.TestTransactionEvent().addTrace({
                        to: (0, tests_utils_1.createAddress)("0x1"),
                        input: selector,
                    });
                    return [4 /*yield*/, handleTransaction(txEvent1)];
                case 1:
                    findings = _c.sent();
                    expect(findings).toStrictEqual([]);
                    txEvent2 = new tests_utils_1.TestTransactionEvent().addTrace({
                        to: (0, tests_utils_1.createAddress)("0x0"),
                        input: selector,
                    });
                    _b = (_a = findings).concat;
                    return [4 /*yield*/, handleTransaction(txEvent2)];
                case 2:
                    findings = _b.apply(_a, [_c.sent()]);
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)(txEvent2)]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should returns a findings only if the function is called from the caller target `from`", function () { return __awaiter(void 0, void 0, void 0, function () {
        var signature, selector, txEvent1, findings, txEvent2, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    signature = "Func()";
                    selector = abi.encodeFunctionSignature(signature);
                    handleTransaction = (0, function_calls_1.default)(tests_utils_1.generalTestFindingGenerator, signature, {
                        from: (0, tests_utils_1.createAddress)("0x0"),
                    });
                    txEvent1 = new tests_utils_1.TestTransactionEvent().addTrace({
                        from: (0, tests_utils_1.createAddress)("0x1"),
                        input: selector,
                    });
                    return [4 /*yield*/, handleTransaction(txEvent1)];
                case 1:
                    findings = _c.sent();
                    expect(findings).toStrictEqual([]);
                    txEvent2 = new tests_utils_1.TestTransactionEvent().addTrace({
                        from: (0, tests_utils_1.createAddress)("0x0"),
                        input: selector,
                    });
                    _b = (_a = findings).concat;
                    return [4 /*yield*/, handleTransaction(txEvent2)];
                case 2:
                    findings = _b.apply(_a, [_c.sent()]);
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)(txEvent2)]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should returns a finding only if all the conditions are met", function () { return __awaiter(void 0, void 0, void 0, function () {
        var signature, selector, txEvent1, findings, txEvent2, _a, _b, txEvent3, _c, _d, txEvent4, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    signature = "Func()";
                    selector = abi.encodeFunctionSignature(signature);
                    handleTransaction = (0, function_calls_1.default)(tests_utils_1.generalTestFindingGenerator, signature, {
                        from: (0, tests_utils_1.createAddress)("0x1"),
                        to: (0, tests_utils_1.createAddress)("0x2"),
                    });
                    txEvent1 = new tests_utils_1.TestTransactionEvent().addTrace({
                        from: (0, tests_utils_1.createAddress)("0x0"),
                        to: (0, tests_utils_1.createAddress)("0x2"),
                        input: selector,
                    });
                    return [4 /*yield*/, handleTransaction(txEvent1)];
                case 1:
                    findings = _g.sent();
                    expect(findings).toStrictEqual([]);
                    txEvent2 = new tests_utils_1.TestTransactionEvent().addTrace({
                        from: (0, tests_utils_1.createAddress)("0x1"),
                        to: (0, tests_utils_1.createAddress)("0x0"),
                        input: selector,
                    });
                    _b = (_a = findings).concat;
                    return [4 /*yield*/, handleTransaction(txEvent2)];
                case 2:
                    findings = _b.apply(_a, [_g.sent()]);
                    expect(findings).toStrictEqual([]);
                    txEvent3 = new tests_utils_1.TestTransactionEvent().addTrace({
                        from: (0, tests_utils_1.createAddress)("0x0"),
                        to: (0, tests_utils_1.createAddress)("0x3"),
                        input: selector,
                    });
                    _d = (_c = findings).concat;
                    return [4 /*yield*/, handleTransaction(txEvent3)];
                case 3:
                    findings = _d.apply(_c, [_g.sent()]);
                    expect(findings).toStrictEqual([]);
                    txEvent4 = new tests_utils_1.TestTransactionEvent().addTrace({
                        from: (0, tests_utils_1.createAddress)("0x1"),
                        to: (0, tests_utils_1.createAddress)("0x2"),
                        input: selector,
                    });
                    _f = (_e = findings).concat;
                    return [4 /*yield*/, handleTransaction(txEvent4)];
                case 4:
                    findings = _f.apply(_e, [_g.sent()]);
                    expect(findings).toStrictEqual([(0, tests_utils_1.generalTestFindingGenerator)(txEvent4)]);
                    return [2 /*return*/];
            }
        });
    }); });
    it("Should pass correct metadata to findingGenerator", function () { return __awaiter(void 0, void 0, void 0, function () {
        var findingGenerator, signature, input, to, from, txEvent, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    findingGenerator = function (metadata) {
                        return forta_agent_1.Finding.fromObject({
                            name: "Test Name",
                            description: "Test Description",
                            alertId: "Test Id",
                            severity: forta_agent_1.FindingSeverity.Medium,
                            type: forta_agent_1.FindingType.Suspicious,
                            metadata: {
                                from: metadata === null || metadata === void 0 ? void 0 : metadata.from,
                                to: metadata === null || metadata === void 0 ? void 0 : metadata.to,
                                input: metadata === null || metadata === void 0 ? void 0 : metadata.input,
                            },
                        });
                    };
                    signature = "myMethod(uint256,string)";
                    input = abi.encodeFunctionCall({
                        name: "myMethod",
                        type: "function",
                        inputs: [
                            {
                                type: "uint256",
                                name: "myNumber",
                            },
                            {
                                type: "string",
                                name: "myString",
                            },
                        ],
                    }, ["2345675643", "Hello!%"]);
                    to = (0, tests_utils_1.createAddress)("0x1");
                    from = (0, tests_utils_1.createAddress)("0x2");
                    handleTransaction = (0, function_calls_1.default)(findingGenerator, signature, { to: to, from: from });
                    txEvent = new tests_utils_1.TestTransactionEvent().addTrace({ to: to, from: from, input: input });
                    return [4 /*yield*/, handleTransaction(txEvent)];
                case 1:
                    findings = _a.sent();
                    expect(findings).toStrictEqual([findingGenerator({ to: to, from: from, input: input })]);
                    return [2 /*return*/];
            }
        });
    }); });
});
