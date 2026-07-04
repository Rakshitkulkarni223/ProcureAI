"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BasketController_1 = require("../controllers/BasketController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/basket/optimize', auth_1.authenticate, BasketController_1.BasketController.optimize);
router.get('/basket/history', auth_1.authenticate, BasketController_1.BasketController.history);
exports.default = router;
