"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.post('/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
    body('role').optional().isIn(['ADMIN', 'PROJECT_MANAGER', 'MECHANICAL_DESIGNER', 'ELECTRICAL_DESIGNER', 'SIMULATION_ENGINEER', 'MANUFACTURING_ENGINEER', 'QUALITY_ENGINEER', 'TECHNICIAN', 'OPERATOR'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, email, password, firstName, lastName, role } = req.body;
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        const saltRounds = 12;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                firstName,
                lastName,
                role: role || 'TECHNICIAN'
            }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
router.post('/login', async (req, res) => {
    console.log('LOGIN ROUTE HIT', req.body);
    try {
        const { username, email, password } = req.body;
        if (!password || (!username && !email)) {
            return res.status(400).json({ error: 'Username or email and password are required' });
        }
        const userIdentifier = (username || email || '').trim();
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    username ? { username: userIdentifier } : undefined,
                    email ? { email: userIdentifier } : undefined
                ].filter(Boolean)
            }
        });
        const passwordHash = user ? user.passwordHash : '$2a$12$invalidsaltinvalidsaltinv.uq6pQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQe';
        const isValidPassword = await bcryptjs_1.default.compare(password, passwordHash);
        if (!user || !isValidPassword) {
            console.warn(`Failed login attempt for user: ${userIdentifier} from IP: ${req.ip}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map