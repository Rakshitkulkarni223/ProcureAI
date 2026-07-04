"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const http_1 = require("../utils/http");
const logger_1 = require("../utils/logger");
function notFound(_req, res) {
    res.status(404).json({ success: false, error: 'Resource not found' });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(422).json({
            success: false,
            error: 'Validation failed',
            details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
    }
    if (err instanceof http_1.ApiError) {
        return res.status(err.statusCode).json({ success: false, error: err.message, details: err.details });
    }
    // Mongo duplicate key
    if (typeof err === 'object' && err && err.code === 11000) {
        return res.status(409).json({ success: false, error: 'Duplicate entry' });
    }
    logger_1.logger.error('Unhandled error', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
}
