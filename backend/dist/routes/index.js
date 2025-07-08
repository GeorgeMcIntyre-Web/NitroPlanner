"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = exports.projectsRouter = exports.usersRouter = void 0;
const users_1 = __importDefault(require("./users"));
exports.usersRouter = users_1.default;
const projects_1 = __importDefault(require("./projects"));
exports.projectsRouter = projects_1.default;
const auth_1 = __importDefault(require("./auth"));
exports.authRouter = auth_1.default;
//# sourceMappingURL=index.js.map