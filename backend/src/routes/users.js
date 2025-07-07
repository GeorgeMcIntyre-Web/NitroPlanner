const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            subscriptionTier: true
          }
        },
        _count: {
          select: {
            assignedWorkUnits: true,
            assignedTasks: true,
            createdProjects: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update current user profile
router.put('/me', [
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 }),
  body('department').optional().isLength({ min: 1, max: 100 }),
  body('avatar').optional().isURL()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, department, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(department && { department }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/me/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true }
    });

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID (within same company)
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        isActive: true
      },
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
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found in your company'
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user's assigned work
router.get('/:id/work', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.query;

    // Verify user belongs to same company
    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found in your company'
      });
    }

    const where = { assignedToId: id };

    const [workUnits, tasks] = await Promise.all([
      type === 'all' || type === 'workUnits' ? prisma.workUnit.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }) : [],
      type === 'all' || type === 'tasks' ? prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }) : []
    ]);

    res.json({
      workUnits,
      tasks
    });
  } catch (error) {
    next(error);
  }
});

// Get user's activity
router.get('/:id/activity', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    // Verify user belongs to same company
    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId,
        isActive: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found in your company'
      });
    }

    // Get recent activity (this is a simplified version)
    // In a real app, you might have a separate activity log table
    const recentWorkUnits = await prisma.workUnit.findMany({
      where: { assignedToId: id },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit)
    });

    const recentTasks = await prisma.task.findMany({
      where: { assignedToId: id },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit)
    });

    // Combine and sort by date
    const activity = [...recentWorkUnits, ...recentTasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, parseInt(limit));

    res.json(activity);
  } catch (error) {
    next(error);
  }
});

// Deactivate user (company admin only)
router.put('/:id/deactivate', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is company admin
    const companyUsers = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'asc' }
    });

    const isAdmin = companyUsers[0]?.id === req.user.id;
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Company admin access required' });
    }

    // Prevent deactivating self
    if (id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot deactivate self',
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found in your company'
      });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 