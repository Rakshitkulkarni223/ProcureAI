"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function log(level, message, meta) {
    const time = new Date().toISOString();
    const base = `[${time}] [${level.toUpperCase()}] ${message}`;
    if (meta !== undefined) {
        console[level === 'debug' ? 'log' : level](base, meta);
    }
    else {
        console[level === 'debug' ? 'log' : level](base);
    }
}
exports.logger = {
    info: (m, meta) => log('info', m, meta),
    warn: (m, meta) => log('warn', m, meta),
    error: (m, meta) => log('error', m, meta),
    debug: (m, meta) => log('debug', m, meta),
};
