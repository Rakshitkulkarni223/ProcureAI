"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasketHistory = void 0;
const mongoose_1 = require("mongoose");
const basketHistorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    suppliers: { type: [String], default: [] },
    itemCount: { type: Number, default: 0 },
    items: {
        type: [
            {
                _id: false,
                query: String,
                quantity: Number,
                supplier: String,
                price: Number,
            },
        ],
        default: [],
    },
    splitTotal: { type: Number, default: 0 },
    baselineTotal: { type: Number, default: 0 },
    estimatedSavings: { type: Number, default: 0 },
    supplierCount: { type: Number, default: 0 },
    recommendedPlan: { type: String, default: 'split' },
    weightProfile: { type: String, default: 'balanced' },
}, { timestamps: true });
basketHistorySchema.index({ userId: 1, createdAt: -1 });
basketHistorySchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
exports.BasketHistory = (0, mongoose_1.model)('BasketHistory', basketHistorySchema);
