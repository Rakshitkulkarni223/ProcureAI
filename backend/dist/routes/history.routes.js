"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const HistoryController_1 = require("../controllers/HistoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/history', auth_1.authenticate, HistoryController_1.HistoryController.list);
router.delete('/history/:id', auth_1.authenticate, HistoryController_1.HistoryController.remove);
exports.default = router;
