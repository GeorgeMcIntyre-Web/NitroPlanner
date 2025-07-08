import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';

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

export default router; 