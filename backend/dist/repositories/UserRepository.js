"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const User_1 = require("../models/User");
class UserRepository {
    findByEmail(email) {
        return User_1.User.findOne({ email: email.toLowerCase().trim() });
    }
    findById(id) {
        return User_1.User.findById(id);
    }
    create(data) {
        return User_1.User.create({ ...data, email: data.email.toLowerCase().trim() });
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
