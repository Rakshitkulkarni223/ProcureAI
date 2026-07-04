"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPreference = void 0;
const mongoose_1 = require("mongoose");
const preferenceSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    defaultCategory: { type: String, default: 'electronics' },
    enabledSuppliers: { type: [String], default: [] },
    sortPreference: {
        type: String,
        enum: ['lowest_price', 'highest_rating', 'fastest_delivery', 'highest_discount'],
        default: 'lowest_price',
    },
    weightProfile: {
        type: String,
        enum: ['balanced', 'startup', 'hospital', 'restaurant'],
        default: 'balanced',
    },
    businessType: { type: String, default: 'general' },
}, { timestamps: true });
preferenceSchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
exports.UserPreference = (0, mongoose_1.model)('UserPreference', preferenceSchema);
