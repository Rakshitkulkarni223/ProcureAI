"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceController = void 0;
const http_1 = require("../utils/http");
const PreferenceService_1 = require("../services/PreferenceService");
const schemas_1 = require("../validators/schemas");
exports.PreferenceController = {
    get: (0, http_1.asyncHandler)(async (req, res) => {
        return (0, http_1.ok)(res, await PreferenceService_1.PreferenceService.get(req.user.sub));
    }),
    update: (0, http_1.asyncHandler)(async (req, res) => {
        const input = schemas_1.preferenceSchema.parse(req.body);
        return (0, http_1.ok)(res, await PreferenceService_1.PreferenceService.update(req.user.sub, input));
    }),
    weightProfiles: (0, http_1.asyncHandler)(async (_req, res) => {
        return (0, http_1.ok)(res, PreferenceService_1.PreferenceService.weightProfiles());
    }),
};
