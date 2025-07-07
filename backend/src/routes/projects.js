const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects for company
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      companyId: req.user.companyId
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          budget: true,
          priority: true,
          progress: true,
          predictedCompletion: true,
          confidenceScore: true,
          riskLevel: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              workUnits: true,
              tasks: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      projects,
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

// Create new project
router.post('/', [
  body('name').isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('budget').optional().isFloat({ min: 0 }),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      description,
      status = 'active',
      startDate,
      endDate,
      budget,
      priority = 'medium'
    } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        priority,
        companyId: req.user.companyId,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    next(error);
  }
});

// Get project by ID
router.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        workUnits: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
            workUnitType: true,
            roleType: true,
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
            priority: true,
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            workUnits: true,
            tasks: true,
            monteCarloSimulations: true,
            cadFiles: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:id', [
  body('name').optional().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('budget').optional().isFloat({ min: 0 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('progress').optional().isFloat({ min: 0, max: 100 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      name,
      description,
      status,
      startDate,
      endDate,
      budget,
      priority,
      progress
    } = req.body;

    // Check if project exists and belongs to company
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(priority && { priority }),
        ...(progress !== undefined && { progress: parseFloat(progress) })
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if project exists and belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    // Delete project and all related data
    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get project statistics
router.get('/:id/stats', async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Check if project exists and belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: req.user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    const [
      workUnitStats,
      taskStats,
      userStats
    ] = await Promise.all([
      // Work unit statistics
      prisma.workUnit.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true }
      }),
      // Task statistics
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true }
      }),
      // User statistics
      prisma.user.findMany({
        where: {
          OR: [
            { assignedWorkUnits: { some: { projectId } } },
            { assignedTasks: { some: { projectId } } }
          ],
          companyId: req.user.companyId
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          _count: {
            select: {
              assignedWorkUnits: {
                where: { projectId }
              },
              assignedTasks: {
                where: { projectId }
              }
            }
          }
        }
      })
    ]);

    res.json({
      workUnitStats,
      taskStats,
      userStats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 