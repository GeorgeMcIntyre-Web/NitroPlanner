"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const express_validator_2 = require("express-validator");
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.post('/register', [
    (0, express_validator_1.body)('username').isLength({ min: 3 }).trim().escape(),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('firstName').optional().trim().escape(),
    (0, express_validator_1.body)('lastName').optional().trim().escape(),
    (0, express_validator_1.body)('role').optional().isIn(['ADMIN', 'PROJECT_MANAGER', 'MECHANICAL_DESIGNER', 'ELECTRICAL_DESIGNER', 'SIMULATION_ENGINEER', 'MANUFACTURING_ENGINEER', 'QUALITY_ENGINEER', 'TECHNICIAN', 'OPERATOR']),
    (0, express_validator_1.body)('companyId').isString().notEmpty()
], async (req, res) => {
    try {
        const errors = (0, express_validator_2.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { username, email, password, firstName, lastName, role, companyId } = req.body;
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });
        if (existingUser) {
            res.status(400).json({ error: 'Username or email already exists' });
            return;
        }
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });
        if (!company) {
            res.status(400).json({ error: 'Invalid company ID' });
            return;
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
                role: role || 'TECHNICIAN',
                companyId
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
            res.status(400).json({ error: 'Username or email and password are required' });
            return;
        }
        const orConditions = [];
        if (username) {
            orConditions.push({ username: username });
        }
        if (email) {
            orConditions.push({ email: email });
        }
        const user = await prisma.user.findFirst({
            where: {
                OR: orConditions
            }
        });
        if (!user) {
            console.warn(`Failed login attempt: user not found for ${username || email} from IP: ${req.ip}`);
            res.status(401).json({ error: 'No account found for the provided username or email.' });
            return;
        }
        const passwordHash = user.passwordHash;
        const isValidPassword = await bcryptjs_1.default.compare(password, passwordHash);
        if (!isValidPassword) {
            console.warn(`Failed login attempt: invalid password for user: ${username || email} from IP: ${req.ip}`);
            res.status(401).json({ error: 'Incorrect password.' });
            return;
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
            access_token: token,
            refresh_token: token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        if (process.env.NODE_ENV === 'development') {
            res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : error });
        }
        else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});
router.post('/2fa/setup', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }
        const secret = speakeasy_1.default.generateSecret({
            name: 'NitroPlanner',
            issuer: 'NitroPlanner',
            length: 32
        });
        const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
        const backupCodes = Array.from({ length: 10 }, () => Math.random().toString(36).substring(2, 8).toUpperCase());
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret.base32,
                backupCodes: backupCodes
            }
        });
        res.json({
            secret: secret.base32,
            qrCodeUrl,
            backupCodes,
            message: '2FA setup initiated. Scan QR code with authenticator app.'
        });
    }
    catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: 'Failed to setup 2FA' });
    }
});
router.post('/2fa/enable', async (req, res) => {
    try {
        const { userId, token } = req.body;
        if (!userId || !token) {
            res.status(400).json({ error: 'User ID and token are required' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || !user.twoFactorSecret) {
            res.status(400).json({ error: 'User not found or 2FA not setup' });
            return;
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });
        if (!verified) {
            res.status(400).json({ error: 'Invalid 2FA token' });
            return;
        }
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });
        res.json({ message: '2FA enabled successfully' });
    }
    catch (error) {
        console.error('2FA enable error:', error);
        res.status(500).json({ error: 'Failed to enable 2FA' });
    }
});
router.post('/2fa/disable', async (req, res) => {
    try {
        const { userId, token } = req.body;
        if (!userId || !token) {
            res.status(400).json({ error: 'User ID and token are required' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || !user.twoFactorSecret) {
            res.status(400).json({ error: 'User not found or 2FA not setup' });
            return;
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });
        if (!verified) {
            res.status(400).json({ error: 'Invalid 2FA token' });
            return;
        }
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: { set: null }
            }
        });
        res.json({ message: '2FA disabled successfully' });
    }
    catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});
router.post('/2fa/verify', async (req, res) => {
    try {
        const { userId, token, isBackupCode = false } = req.body;
        if (!userId || !token) {
            res.status(400).json({ error: 'User ID and token are required' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user || !user.twoFactorEnabled) {
            res.status(400).json({ error: 'User not found or 2FA not enabled' });
            return;
        }
        let verified = false;
        if (isBackupCode) {
            const backupCodes = user.backupCodes || [];
            const codeIndex = backupCodes.indexOf(token);
            if (codeIndex !== -1) {
                backupCodes.splice(codeIndex, 1);
                await prisma.user.update({
                    where: { id: userId },
                    data: { backupCodes: backupCodes }
                });
                verified = true;
            }
        }
        else {
            verified = speakeasy_1.default.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 2
            });
        }
        if (!verified) {
            res.status(400).json({ error: 'Invalid 2FA token' });
            return;
        }
        res.json({ message: '2FA verification successful' });
    }
    catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ error: 'Failed to verify 2FA' });
    }
});
router.post('/azure/login', async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            res.status(400).json({ error: 'Azure access token is required' });
            return;
        }
        const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!graphResponse.ok) {
            res.status(401).json({ error: 'Invalid Azure token' });
            return;
        }
        const userData = await graphResponse.json();
        const azureUser = userData;
        const orFilters = [];
        if (azureUser.mail || azureUser.userPrincipalName) {
            orFilters.push({ email: (azureUser.mail || azureUser.userPrincipalName) });
        }
        if (azureUser.userPrincipalName) {
            orFilters.push({ username: azureUser.userPrincipalName });
        }
        let user = await prisma.user.findFirst({
            where: {
                OR: orFilters
            }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: azureUser.userPrincipalName || '',
                    email: azureUser.mail || azureUser.userPrincipalName || '',
                    firstName: azureUser.givenName || '',
                    lastName: azureUser.surname || '',
                    passwordHash: '',
                    role: 'TECHNICIAN',
                    companyId: req.body.companyId || 'default-company',
                    isActive: true
                }
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
        res.json({
            message: 'Azure login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            access_token: token,
            refresh_token: token
        });
    }
    catch (error) {
        console.error('Azure login error:', error);
        res.status(500).json({ error: 'Azure authentication failed' });
    }
});
router.get('/azure/config', (req, res) => {
    res.json({
        clientId: process.env.AZURE_CLIENT_ID,
        tenantId: process.env.AZURE_TENANT_ID,
        redirectUri: process.env.AZURE_REDIRECT_URI
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map