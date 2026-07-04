"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchHistory = void 0;
const mongoose_1 = require("mongoose");
const searchHistorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true },
    category: { type: String, required: true },
    suppliers: { type: [String], default: [] },
    resultCount: { type: Number, default: 0 },
    recommendedSupplier: { type: String, default: '' },
    bestPrice: { type: Number, default: 0 },
    estimatedSavings: { type: Number, default: 0 },
    weightProfile: { type: String, default: 'balanced' },
}, { timestamps: true });
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
exports.SearchHistory = (0, mongoose_1.model)('SearchHistory', searchHistorySchema);
