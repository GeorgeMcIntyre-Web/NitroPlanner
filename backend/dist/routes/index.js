"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const users_1 = __importDefault(require("./users"));
const projects_1 = __importDefault(require("./projects"));
const tasks_1 = __importDefault(require("./tasks"));
const workUnits_1 = __importDefault(require("./workUnits"));
const analytics_1 = __importDefault(require("./analytics"));
const templates_1 = __importDefault(require("./templates"));
const import_export_1 = __importDefault(require("./import-export"));
const digital_twin_1 = __importDefault(require("./digital-twin"));
const router = express_1.default.Router();
router.use('/auth', auth_1.default);
router.use('/users', users_1.default);
router.use('/projects', projects_1.default);
router.use('/tasks', tasks_1.default);
router.use('/work-units', workUnits_1.default);
router.use('/analytics', analytics_1.default);
router.use('/templates', templates_1.default);
router.use('/import-export', import_export_1.default);
router.use('/digital-twin', digital_twin_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map