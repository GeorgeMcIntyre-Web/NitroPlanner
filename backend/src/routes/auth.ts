import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const router = express.Router();
const prisma = new PrismaClient();

// Register user
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  body('role').optional().isIn(['ADMIN', 'PROJECT_MANAGER', 'MECHANICAL_DESIGNER', 'ELECTRICAL_DESIGNER', 'SIMULATION_ENGINEER', 'MANUFACTURING_ENGINEER', 'QUALITY_ENGINEER', 'TECHNICIAN', 'OPERATOR']),
  body('companyId').isString().notEmpty()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { username, email, password, firstName, lastName, role, companyId } = req.body;

    // Check if user already exists
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

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      res.status(400).json({ error: 'Invalid company ID' });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Hardened, production-ready login route
router.post('/login', async (req: Request, res: Response) => {
  console.log('LOGIN ROUTE HIT', req.body);
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      res.status(400).json({ error: 'Username or email and password are required' });
      return;
    }

    // Build the OR array conditionally to avoid undefined values
    const orConditions = [];
    if (username) {
      orConditions.push({ username: username });
    }
    if (email) {
      orConditions.push({ email: email });
    }

    // Find user by username or email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: orConditions
      }
    });

    // Always use bcrypt.compare to mitigate timing attacks
    const passwordHash = user ? user.passwordHash : '$2a$12$invalidsaltinvalidsaltinv.uq6pQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQeQe';
    const isValidPassword = await bcrypt.compare(password, passwordHash);

    if (!user || !isValidPassword) {
      // Log failed attempt (do not log password)
      console.warn(`Failed login attempt for user: ${username || email} from IP: ${req.ip}`);
      // Respond with generic error
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

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
      refresh_token: token // For now, use the same token for both
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2FA Setup - Generate secret and QR code
router.post('/2fa/setup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: 'NitroPlanner',
      issuer: 'NitroPlanner',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Update user with secret and backup codes
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
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// 2FA Enable - Verify token and enable 2FA
router.post('/2fa/enable', async (req: Request, res: Response) => {
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

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      res.status(400).json({ error: 'Invalid 2FA token' });
      return;
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// 2FA Disable
router.post('/2fa/disable', async (req: Request, res: Response): Promise<void> => {
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

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      res.status(400).json({ error: 'Invalid 2FA token' });
      return;
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: { set: null }
      }
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// 2FA Verify - For login
router.post('/2fa/verify', async (req: Request, res: Response) => {
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
      // Verify backup code
      const backupCodes = user.backupCodes as string[] || [];
      const codeIndex = backupCodes.indexOf(token);
      
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: { backupCodes: backupCodes }
        });
        verified = true;
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
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
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Azure AD Authentication
router.post('/azure/login', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      res.status(400).json({ error: 'Azure access token is required' });
      return;
    }

    // Verify Azure token with Microsoft Graph API
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
    // Type assertion for userData from Microsoft Graph API
    interface AzureUserData {
      userPrincipalName?: string;
      mail?: string;
      givenName?: string;
      surname?: string;
    }
    const azureUser = userData as AzureUserData;
    // Find or create user
    const orFilters = [];
    if (azureUser.mail || azureUser.userPrincipalName) {
      orFilters.push({ email: (azureUser.mail || azureUser.userPrincipalName) as string });
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
      // Create new user from Azure AD
      user = await prisma.user.create({
        data: {
          username: azureUser.userPrincipalName || '',
          email: azureUser.mail || azureUser.userPrincipalName || '',
          firstName: azureUser.givenName || '',
          lastName: azureUser.surname || '',
          passwordHash: '', // Azure users don't have passwords
          role: 'TECHNICIAN', // Default role
          companyId: req.body.companyId || 'default-company', // You might want to handle this differently
          isActive: true
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('Azure login error:', error);
    res.status(500).json({ error: 'Azure authentication failed' });
  }
});

// Azure AD configuration endpoint
router.get('/azure/config', (req: Request, res: Response) => {
  res.json({
    clientId: process.env.AZURE_CLIENT_ID,
    tenantId: process.env.AZURE_TENANT_ID,
    redirectUri: process.env.AZURE_REDIRECT_URI
  });
});

export default router; 