const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { generateToken, hashPassword, comparePassword } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 8 }),
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 }),
  body('role').isIn(['mechanical_designer', 'electrical_designer', 'simulation_engineer', 'manufacturing_engineer', 'quality_engineer', 'project_manager']),
  body('department').optional().isLength({ min: 1, max: 100 }),
  body('companyName').isLength({ min: 1, max: 200 }),
  body('industry').optional().isIn(['automotive', 'aerospace', 'manufacturing', 'other']),
  body('companySize').optional().isIn(['small', 'medium', 'large'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Register new company and user
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      email,
      username,
      password,
      firstName,
      lastName,
      role,
      department,
      companyName,
      industry,
      companySize
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          industry,
          companySize,
          subscriptionTier: 'basic',
          settings: {
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            currency: 'USD'
          }
        }
      });

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          department,
          companyId: company.id
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          companyId: true,
          createdAt: true
        }
      });

      return { company, user };
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      companyId: result.user.companyId
    });

    res.status(201).json({
      message: 'Company and user registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        department: result.user.department
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        industry: result.company.industry,
        subscriptionTier: result.company.subscriptionTier
      },
      token
    });

  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with company info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            subscriptionTier: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }

    if (!user.company.isActive) {
      return res.status(401).json({
        error: 'Company inactive',
        message: 'Your company account has been deactivated'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        industry: user.company.industry,
        subscriptionTier: user.company.subscriptionTier
      },
      token
    });

  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    // This route requires authentication, so we'll add middleware later
    // For now, we'll return an error
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please login to access your profile'
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token (optional - for extending session)
router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Please provide a valid token'
      });
    }

    // Verify current token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        companyId: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId
    });

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }
    next(error);
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful',
    note: 'Token should be removed from client storage'
  });
});

module.exports = router; 