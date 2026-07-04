"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceService = void 0;
const PreferenceRepository_1 = require("../repositories/PreferenceRepository");
const data_1 = require("../config/data");
class PreferenceService {
    static async get(userId) {
        let pref = await PreferenceRepository_1.preferenceRepository.getByUser(userId);
        if (!pref)
            pref = await PreferenceRepository_1.preferenceRepository.upsert(userId, {});
        return pref;
    }
    static async update(userId, data) {
        const allowed = ['defaultCategory', 'enabledSuppliers', 'sortPreference', 'weightProfile', 'businessType'];
        const clean = {};
        for (const key of allowed) {
            if (data[key] !== undefined)
                clean[key] = data[key];
        }
        return PreferenceRepository_1.preferenceRepository.upsert(userId, clean);
    }
    static weightProfiles() {
        return Object.values(data_1.WEIGHT_PROFILES);
    }
}
exports.PreferenceService = PreferenceService;
