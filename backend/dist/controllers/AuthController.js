"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_1 = require("../utils/http");
const AuthService_1 = require("../services/AuthService");
const UserRepository_1 = require("../repositories/UserRepository");
const schemas_1 = require("../validators/schemas");
exports.AuthController = {
    register: (0, http_1.asyncHandler)(async (req, res) => {
        const input = schemas_1.registerSchema.parse(req.body);
        const result = await AuthService_1.AuthService.register(input);
        return (0, http_1.ok)(res, result, 201);
    }),
    login: (0, http_1.asyncHandler)(async (req, res) => {
        const { email, password } = schemas_1.loginSchema.parse(req.body);
        const result = await AuthService_1.AuthService.login(email, password);
        return (0, http_1.ok)(res, result);
    }),
    me: (0, http_1.asyncHandler)(async (req, res) => {
        const user = await UserRepository_1.userRepository.findById(req.user.sub);
        if (!user)
            return res.status(404).json({ success: false, error: 'User not found' });
        return (0, http_1.ok)(res, user.toJSON());
    }),
    logout: (0, http_1.asyncHandler)(async (_req, res) => {
        // Stateless JWT: the client discards the token. Endpoint provided for parity.
        return (0, http_1.ok)(res, { message: 'Logged out' });
    }),
};
