const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all work units for company
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      projectId,
      status, 
      workUnitType,
      roleType,
      assignedTo,
      search
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      project: {
        companyId: req.user.companyId
      }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (workUnitType) {
      where.workUnitType = workUnitType;
    }

    if (roleType) {
      where.roleType = roleType;
    }

    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [workUnits, total] = await Promise.all([
      prisma.workUnit.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          workUnitType: true,
          roleType: true,
          status: true,
          priority: true,
          estimatedHours: true,
          actualHours: true,
          progress: true,
          startDate: true,
          endDate: true,
          predictedDelay: true,
          riskScore: true,
          confidence: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              checkpoints: true,
              tasks: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.workUnit.count({ where })
    ]);

    res.json({
      workUnits,
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

// Create new work unit
router.post('/', [
  body('projectId').notEmpty(),
  body('name').isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('workUnitType').isIn(['design', 'simulation', 'validation', 'manufacturing', 'assembly', 'testing', 'documentation']),
  body('roleType').isIn(['mechanical_designer', 'electrical_designer', 'simulation_engineer', 'manufacturing_engineer', 'quality_engineer', 'project_manager']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('assignedToId').optional().isString()
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
      projectId,
      name,
      description,
      workUnitType,
      roleType,
      priority = 'medium',
      estimatedHours,
      startDate,
      endDate,
      assignedToId
    } = req.body;

    // Verify project belongs to company
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

    // Verify assigned user belongs to company
    if (assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: req.user.companyId
        }
      });

      if (!assignedUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Assigned user not found in your company'
        });
      }
    }

    const workUnit = await prisma.workUnit.create({
      data: {
        projectId,
        name,
        description,
        workUnitType,
        roleType,
        priority,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        assignedToId,
        createdById: req.user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Work unit created successfully',
      workUnit
    });
  } catch (error) {
    next(error);
  }
});

// Get work unit by ID
router.get('/:id', async (req, res, next) => {
  try {
    const workUnit = await prisma.workUnit.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        checkpoints: {
          select: {
            id: true,
            name: true,
            description: true,
            checkpointType: true,
            status: true,
            requiredRole: true,
            dueDate: true,
            completedDate: true,
            notes: true,
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
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
        }
      }
    });

    if (!workUnit) {
      return res.status(404).json({
        error: 'Work unit not found',
        message: 'Work unit not found in your company'
      });
    }

    res.json(workUnit);
  } catch (error) {
    next(error);
  }
});

// Update work unit
router.put('/:id', [
  body('name').optional().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'on_hold']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('actualHours').optional().isFloat({ min: 0 }),
  body('progress').optional().isFloat({ min: 0, max: 100 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('assignedToId').optional().isString()
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
      priority,
      estimatedHours,
      actualHours,
      progress,
      startDate,
      endDate,
      assignedToId
    } = req.body;

    // Check if work unit exists and belongs to company
    const existingWorkUnit = await prisma.workUnit.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!existingWorkUnit) {
      return res.status(404).json({
        error: 'Work unit not found',
        message: 'Work unit not found in your company'
      });
    }

    // Verify assigned user belongs to company
    if (assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: req.user.companyId
        }
      });

      if (!assignedUser) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Assigned user not found in your company'
        });
      }
    }

    const updatedWorkUnit = await prisma.workUnit.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(estimatedHours !== undefined && { estimatedHours: parseFloat(estimatedHours) }),
        ...(actualHours !== undefined && { actualHours: parseFloat(actualHours) }),
        ...(progress !== undefined && { progress: parseFloat(progress) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(assignedToId !== undefined && { assignedToId })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
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
      message: 'Work unit updated successfully',
      workUnit: updatedWorkUnit
    });
  } catch (error) {
    next(error);
  }
});

// Delete work unit
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if work unit exists and belongs to company
    const workUnit = await prisma.workUnit.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!workUnit) {
      return res.status(404).json({
        error: 'Work unit not found',
        message: 'Work unit not found in your company'
      });
    }

    // Delete work unit and all related data
    await prisma.workUnit.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Work unit deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get work unit checkpoints
router.get('/:id/checkpoints', async (req, res, next) => {
  try {
    const workUnitId = req.params.id;

    // Verify work unit belongs to company
    const workUnit = await prisma.workUnit.findFirst({
      where: {
        id: workUnitId,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!workUnit) {
      return res.status(404).json({
        error: 'Work unit not found',
        message: 'Work unit not found in your company'
      });
    }

    const checkpoints = await prisma.checkpoint.findMany({
      where: { workUnitId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(checkpoints);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 