"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const db_1 = require("./config/db");
const seed_1 = require("./config/seed");
const routes_1 = __importDefault(require("./routes"));
const swagger_1 = require("./config/swagger");
const error_1 = require("./middleware/error");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.corsOrigins === '*' ? true : env_1.env.corsOrigins.split(','),
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '2mb' }));
    app.use((0, morgan_1.default)('tiny'));
    app.use('/api/docs', ...swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.openApiSpec, { customSiteTitle: 'ProcureAI API Docs' }));
    app.use('/api', routes_1.default);
    app.get('/', (_req, res) => res.json({ success: true, service: 'procureai-api', docs: '/api/docs' }));
    app.use(error_1.notFound);
    app.use(error_1.errorHandler);
    await db_1.database.connect();
    await (0, seed_1.runSeed)();
    app.listen(env_1.env.port, '0.0.0.0', () => {
        logger_1.logger.info(`ProcureAI API listening on :${env_1.env.port}`);
    });
}
bootstrap().catch((err) => {
    logger_1.logger.error('Failed to start server', err);
    process.exit(1);
});
