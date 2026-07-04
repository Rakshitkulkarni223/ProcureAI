"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.asyncHandler = void 0;
exports.ok = ok;
/** Wraps async route handlers so rejected promises hit the error middleware. */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.ApiError = ApiError;
function ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}
