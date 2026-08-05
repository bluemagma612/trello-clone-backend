"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json({ limit: '1mb' }));
var port = Number(process.env.PORT) || 8080;
var boardState = { lists: [] };
var isObject = function (value) {
    return typeof value === 'object' && value !== null;
};
var isString = function (value) {
    return typeof value === 'string' && value.trim().length > 0;
};
var validateCard = function (value) {
    if (!isObject(value))
        return false;
    if (!isString(value.id))
        return false;
    if (!isString(value.title))
        return false;
    if (value.description !== undefined &&
        typeof value.description !== 'string')
        return false;
    return true;
};
var validateList = function (value) {
    if (!isObject(value))
        return false;
    if (!isString(value.id))
        return false;
    if (!isString(value.title))
        return false;
    if (!Array.isArray(value.cards))
        return false;
    if (!value.cards.every(validateCard))
        return false;
    return true;
};
var validateBoardState = function (value) {
    if (!isObject(value))
        return false;
    if (!Array.isArray(value.lists))
        return false;
    if (!value.lists.every(validateList))
        return false;
    return true;
};
var parseSavePayload = function (value) {
    if (validateBoardState(value)) {
        return value;
    }
    if (!isObject(value) || !('lists' in value)) {
        return null;
    }
    var candidate = { lists: value.lists };
    return validateBoardState(candidate) ? candidate : null;
};
app.get('/health', function (_req, res) {
    return res.status(200).json({ status: 'ok' });
});
app.post('/save', function (req, res) {
    var parsed = parseSavePayload(req.body);
    if (!parsed) {
        return res.status(400).json({
            success: false,
            error: 'Invalid payload: expected { lists: [{ id, title, cards: [{ id, title, description? }] }] }'
        });
    }
    boardState = parsed;
    return res.status(200).json({ success: true });
});
app.get('/load', function (_req, res) {
    return res.status(200).json(boardState);
});
app.use(function (_req, res) {
    return res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
app.listen(port, function () {
    console.log("Kanban backend running on http://localhost:" + port + "!");
});
