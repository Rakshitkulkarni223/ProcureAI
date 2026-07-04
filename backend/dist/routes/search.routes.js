"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SearchController_1 = require("../controllers/SearchController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/search', auth_1.authenticate, SearchController_1.SearchController.search);
router.post('/recommendations', auth_1.authenticate, SearchController_1.SearchController.recommend);
exports.default = router;
