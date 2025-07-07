const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authorizeCompanyAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get company profile
router.get('/profile', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: {
        id: true,
        name: true,
        industry: true,
        companySize: true,
        subscriptionTier: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            projects: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'Company profile not found'
      });
    }

    res.json(company);
  } catch (error) {
    next(error);
  }
});

// Update company profile
router.put('/profile', [
  body('name').optional().isLength({ min: 1, max: 200 }),
  body('industry').optional().isIn(['automotive', 'aerospace', 'manufacturing', 'other']),
  body('companySize').optional().isIn(['small', 'medium', 'large']),
  body('settings').optional().isObject()
], authorizeCompanyAdmin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, industry, companySize, settings } = req.body;

    const updatedCompany = await prisma.company.update({
      where: { id: req.user.companyId },
      data: {
        ...(name && { name }),
        ...(industry && { industry }),
        ...(companySize && { companySize }),
        ...(settings && { settings })
      },
      select: {
        id: true,
        name: true,
        industry: true,
        companySize: true,
        subscriptionTier: true,
        settings: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Company profile updated successfully',
      company: updatedCompany
    });
  } catch (error) {
    next(error);
  }
});

// Get company users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, department, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: req.user.companyId,
      isActive: true
    };

    if (role) {
      where.role = role;
    }

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          avatar: true,
          lastLogin: true,
          createdAt: true,
          _count: {
            select: {
              assignedWorkUnits: true,
              assignedTasks: true,
              createdProjects: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Invite user to company
router.post('/users/invite', [
  body('email').isEmail().normalizeEmail(),
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 }),
  body('role').isIn(['mechanical_designer', 'electrical_designer', 'simulation_engineer', 'manufacturing_engineer', 'quality_engineer', 'project_manager']),
  body('department').optional().isLength({ min: 1, max: 100 })
], authorizeCompanyAdmin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, firstName, lastName, role, department } = req.body;

    // Check if user already exists in this company
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        companyId: req.user.companyId
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists in your company'
      });
    }

    // Check if user exists in another company
    const userInOtherCompany = await prisma.user.findUnique({
      where: { email }
    });

    if (userInOtherCompany) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists in another company'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const { hashPassword } = require('../middleware/auth');
    const hashedPassword = await hashPassword(tempPassword);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        username: email.split('@')[0] + '_' + Date.now(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        department,
        companyId: req.user.companyId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        createdAt: true
      }
    });

    // TODO: Send invitation email with temporary password
    // For now, we'll return the temporary password in the response
    // In production, this should be sent via email

    res.status(201).json({
      message: 'User invited successfully',
      user: newUser,
      tempPassword,
      note: 'Send this temporary password to the user via email'
    });

  } catch (error) {
    next(error);
  }
});

// Get company statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [
      userCount,
      projectCount,
      activeProjectCount,
      workUnitCount,
      taskCount,
      recentActivity
    ] = await Promise.all([
      prisma.user.count({
        where: { companyId: req.user.companyId, isActive: true }
      }),
      prisma.project.count({
        where: { companyId: req.user.companyId }
      }),
      prisma.project.count({
        where: { companyId: req.user.companyId, status: 'active' }
      }),
      prisma.workUnit.count({
        where: { project: { companyId: req.user.companyId } }
      }),
      prisma.task.count({
        where: { project: { companyId: req.user.companyId } }
      }),
      prisma.project.findMany({
        where: { companyId: req.user.companyId },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      stats: {
        users: userCount,
        projects: projectCount,
        activeProjects: activeProjectCount,
        workUnits: workUnitCount,
        tasks: taskCount
      },
      recentActivity
    });
  } catch (error) {
    next(error);
  }
});

// Get company settings
router.get('/settings', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: {
        settings: true,
        subscriptionTier: true
      }
    });

    res.json({
      settings: company.settings || {},
      subscriptionTier: company.subscriptionTier
    });
  } catch (error) {
    next(error);
  }
});

// Update company settings
router.put('/settings', [
  body('settings').isObject()
], authorizeCompanyAdmin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { settings } = req.body;

    const updatedCompany = await prisma.company.update({
      where: { id: req.user.companyId },
      data: { settings },
      select: {
        settings: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Company settings updated successfully',
      settings: updatedCompany.settings
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 