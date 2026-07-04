"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
/**
 * Singleton database connection manager (Singleton Pattern).
 * Guarantees a single shared Mongoose connection across the application.
 */
class Database {
    constructor() {
        this.connected = false;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.connected)
            return;
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(env_1.env.mongoUrl, { dbName: env_1.env.dbName });
        this.connected = true;
        logger_1.logger.info(`MongoDB connected -> db="${env_1.env.dbName}"`);
    }
    async disconnect() {
        if (!this.connected)
            return;
        await mongoose_1.default.disconnect();
        this.connected = false;
    }
}
exports.database = Database.getInstance();
