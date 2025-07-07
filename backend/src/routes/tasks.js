const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks for company
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      projectId,
      workUnitId,
      status, 
      priority,
      assignedTo,
      kanbanColumn,
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

    if (workUnitId) {
      where.workUnitId = workUnitId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    if (kanbanColumn) {
      where.kanbanColumn = kanbanColumn;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
          actualHours: true,
          progress: true,
          kanbanColumn: true,
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
          workUnit: {
            select: {
              id: true,
              name: true,
              workUnitType: true
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
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
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

// Create new task
router.post('/', [
  body('projectId').notEmpty(),
  body('name').isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('workUnitId').optional().isString(),
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
      priority = 'medium',
      dueDate,
      estimatedHours,
      startDate,
      endDate,
      workUnitId,
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

    // Verify work unit belongs to project (if provided)
    if (workUnitId) {
      const workUnit = await prisma.workUnit.findFirst({
        where: {
          id: workUnitId,
          projectId
        }
      });

      if (!workUnit) {
        return res.status(404).json({
          error: 'Work unit not found',
          message: 'Work unit not found in this project'
        });
      }
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

    const task = await prisma.task.create({
      data: {
        projectId,
        name,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        workUnitId,
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
        workUnit: {
          select: {
            id: true,
            name: true,
            workUnitType: true
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
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
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
        workUnit: {
          select: {
            id: true,
            name: true,
            workUnitType: true,
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
        taskDependencies: {
          select: {
            id: true,
            dependencyType: true,
            dependsOnTask: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found in your company'
      });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', [
  body('name').optional().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['pending', 'in_progress', 'review', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('actualHours').optional().isFloat({ min: 0 }),
  body('progress').optional().isFloat({ min: 0, max: 100 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('kanbanColumn').optional().isIn(['backlog', 'todo', 'in_progress', 'review', 'done']),
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
      dueDate,
      estimatedHours,
      actualHours,
      progress,
      startDate,
      endDate,
      kanbanColumn,
      assignedToId
    } = req.body;

    // Check if task exists and belongs to company
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found in your company'
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

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(estimatedHours !== undefined && { estimatedHours: parseFloat(estimatedHours) }),
        ...(actualHours !== undefined && { actualHours: parseFloat(actualHours) }),
        ...(progress !== undefined && { progress: parseFloat(progress) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(kanbanColumn && { kanbanColumn }),
        ...(assignedToId !== undefined && { assignedToId })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        workUnit: {
          select: {
            id: true,
            name: true,
            workUnitType: true
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
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found in your company'
      });
    }

    // Delete task and all related data
    await prisma.task.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get kanban board data for project
router.get('/kanban/:projectId', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

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

    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        progress: true,
        estimatedHours: true,
        actualHours: true,
        predictedDelay: true,
        riskScore: true,
        kanbanColumn: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        workUnit: {
          select: {
            id: true,
            name: true,
            workUnitType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group tasks by kanban column
    const kanbanData = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: []
    };

    tasks.forEach(task => {
      const column = task.kanbanColumn || 'backlog';
      if (kanbanData[column]) {
        kanbanData[column].push(task);
      }
    });

    res.json(kanbanData);
  } catch (error) {
    next(error);
  }
});

// Update task kanban column
router.put('/:id/move', [
  body('kanbanColumn').isIn(['backlog', 'todo', 'in_progress', 'review', 'done'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { kanbanColumn } = req.body;

    // Check if task exists and belongs to company
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'Task not found in your company'
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: { kanbanColumn },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      message: 'Task moved successfully',
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 