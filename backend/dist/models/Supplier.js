"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supplier = void 0;
const mongoose_1 = require("mongoose");
const supplierSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    color: { type: String, default: '#64748B' },
    logo: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
}, { timestamps: true });
supplierSchema.index({ name: 1, category: 1 }, { unique: true });
supplierSchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
exports.Supplier = (0, mongoose_1.model)('Supplier', supplierSchema);
