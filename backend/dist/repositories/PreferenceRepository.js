"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferenceRepository = exports.PreferenceRepository = void 0;
const UserPreference_1 = require("../models/UserPreference");
class PreferenceRepository {
    getByUser(userId) {
        return UserPreference_1.UserPreference.findOne({ userId });
    }
    upsert(userId, data) {
        return UserPreference_1.UserPreference.findOneAndUpdate({ userId }, { $set: data }, { new: true, upsert: true, setDefaultsOnInsert: true });
    }
}
exports.PreferenceRepository = PreferenceRepository;
exports.preferenceRepository = new PreferenceRepository();
