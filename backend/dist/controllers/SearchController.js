"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const http_1 = require("../utils/http");
const SearchService_1 = require("../services/SearchService");
const RecommendationService_1 = require("../services/RecommendationService");
const schemas_1 = require("../validators/schemas");
exports.SearchController = {
    search: (0, http_1.asyncHandler)(async (req, res) => {
        const input = schemas_1.searchSchema.parse(req.body);
        const result = await SearchService_1.SearchService.search(req.user.sub, input);
        return (0, http_1.ok)(res, result);
    }),
    recommend: (0, http_1.asyncHandler)(async (req, res) => {
        const { products, weightProfile } = schemas_1.recommendationSchema.parse(req.body);
        const recommendation = RecommendationService_1.RecommendationService.recommend(products, weightProfile);
        return (0, http_1.ok)(res, { recommendation });
    }),
};
