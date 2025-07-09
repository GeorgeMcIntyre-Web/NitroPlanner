"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('🔥 BACKEND SERVER STARTED - THIS IS THE REAL ONE!');
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const import_export_1 = __importDefault(require("./routes/import-export"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const digital_twin_1 = __importDefault(require("./routes/digital-twin"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(body_parser_1.default.json());
app.use('/api', routes_1.default);
app.use('/api/import-export', import_export_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/digital-twin', digital_twin_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map