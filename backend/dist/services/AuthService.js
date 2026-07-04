"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
const PreferenceRepository_1 = require("../repositories/PreferenceRepository");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const http_1 = require("../utils/http");
class AuthService {
    static async register(input) {
        const existing = await UserRepository_1.userRepository.findByEmail(input.email);
        if (existing)
            throw new http_1.ApiError(409, 'An account with this email already exists');
        const passwordHash = await (0, password_1.hashPassword)(input.password);
        const user = await UserRepository_1.userRepository.create({
            name: input.name,
            email: input.email,
            passwordHash,
            businessType: input.businessType || 'general',
        });
        await PreferenceRepository_1.preferenceRepository.upsert(user.id, {
            businessType: input.businessType || 'general',
        });
        return AuthService.issue(user);
    }
    static async login(email, password) {
        const user = await UserRepository_1.userRepository.findByEmail(email);
        if (!user)
            throw new http_1.ApiError(401, 'Invalid email or password');
        const valid = await (0, password_1.verifyPassword)(password, user.passwordHash);
        if (!valid)
            throw new http_1.ApiError(401, 'Invalid email or password');
        return AuthService.issue(user);
    }
    static issue(user) {
        const token = (0, jwt_1.signToken)({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
        return { token, user: user.toJSON() };
    }
}
exports.AuthService = AuthService;
