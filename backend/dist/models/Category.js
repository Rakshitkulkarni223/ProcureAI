"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    icon: { type: String, default: 'Box' },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
}, { timestamps: true });
categorySchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
exports.Category = (0, mongoose_1.model)('Category', categorySchema);
