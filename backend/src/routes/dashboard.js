const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get role-based dashboard data
router.get('/:role', async (req, res, next) => {
  try {
    const { role } = req.params;
    const { timeframe = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get company statistics
    const [
      totalProjects,
      activeProjects,
      totalWorkUnits,
      totalTasks,
      activeTasks,
      highPriorityTasks,
      overdueTasks,
      recentProjects,
      recentWorkUnits,
      recentTasks,
      userStats,
      roleStats
    ] = await Promise.all([
      // Total projects
      prisma.project.count({
        where: { companyId: req.user.companyId }
      }),
      // Active projects
      prisma.project.count({
        where: { 
          companyId: req.user.companyId,
          status: 'active'
        }
      }),
      // Total work units
      prisma.workUnit.count({
        where: {
          project: { companyId: req.user.companyId }
        }
      }),
      // Total tasks
      prisma.task.count({
        where: {
          project: { companyId: req.user.companyId }
        }
      }),
      // Active tasks
      prisma.task.count({
        where: {
          project: { companyId: req.user.companyId },
          status: 'in_progress'
        }
      }),
      // High priority tasks
      prisma.task.count({
        where: {
          project: { companyId: req.user.companyId },
          priority: 'high'
        }
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          project: { companyId: req.user.companyId },
          dueDate: { lt: new Date() },
          status: { not: 'completed' }
        }
      }),
      // Recent projects
      prisma.project.findMany({
        where: {
          companyId: req.user.companyId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // Recent work units
      prisma.workUnit.findMany({
        where: {
          project: { companyId: req.user.companyId },
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          name: true,
          workUnitType: true,
          status: true,
          progress: true,
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // Recent tasks
      prisma.task.findMany({
        where: {
          project: { companyId: req.user.companyId },
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          progress: true,
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // User statistics
      prisma.user.findMany({
        where: { 
          companyId: req.user.companyId,
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          _count: {
            select: {
              assignedWorkUnits: {
                where: {
                  project: { companyId: req.user.companyId }
                }
              },
              assignedTasks: {
                where: {
                  project: { companyId: req.user.companyId }
                }
              }
            }
          }
        }
      }),
      // Role-based statistics
      prisma.workUnit.groupBy({
        by: ['roleType'],
        where: {
          project: { companyId: req.user.companyId }
        },
        _count: { roleType: true }
      })
    ]);

    // Role-specific data
    let roleSpecificData = {};
    
    if (role === 'project_manager') {
      const [projectProgress, taskStatus, workUnitStatus] = await Promise.all([
        // Project progress distribution
        prisma.project.groupBy({
          by: ['status'],
          where: { companyId: req.user.companyId },
          _count: { status: true }
        }),
        // Task status distribution
        prisma.task.groupBy({
          by: ['status'],
          where: {
            project: { companyId: req.user.companyId }
          },
          _count: { status: true }
        }),
        // Work unit status distribution
        prisma.workUnit.groupBy({
          by: ['status'],
          where: {
            project: { companyId: req.user.companyId }
          },
          _count: { status: true }
        })
      ]);

      roleSpecificData = {
        projectProgress,
        taskStatus,
        workUnitStatus
      };
    } else {
      // Get user's assigned work
      const [assignedWorkUnits, assignedTasks] = await Promise.all([
        prisma.workUnit.findMany({
          where: {
            assignedToId: req.user.id,
            project: { companyId: req.user.companyId }
          },
          select: {
            id: true,
            name: true,
            workUnitType: true,
            status: true,
            progress: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { dueDate: 'asc' },
          take: 10
        }),
        prisma.task.findMany({
          where: {
            assignedToId: req.user.id,
            project: { companyId: req.user.companyId }
          },
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            progress: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { dueDate: 'asc' },
          take: 10
        })
      ]);

      roleSpecificData = {
        assignedWorkUnits,
        assignedTasks
      };
    }

    // Kanban summary
    const kanbanSummary = await prisma.task.groupBy({
      by: ['kanbanColumn'],
      where: {
        project: { companyId: req.user.companyId }
      },
      _count: { kanbanColumn: true }
    });

    const kanbanData = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    };

    kanbanSummary.forEach(item => {
      if (kanbanData.hasOwnProperty(item.kanbanColumn)) {
        kanbanData[item.kanbanColumn] = item._count.kanbanColumn;
      }
    });

    res.json({
      role,
      timeframe: parseInt(timeframe),
      stats: {
        totalProjects,
        activeProjects,
        totalWorkUnits,
        totalTasks,
        activeTasks,
        highPriorityTasks,
        overdueTasks
      },
      recentActivity: {
        projects: recentProjects,
        workUnits: recentWorkUnits,
        tasks: recentTasks
      },
      userStats,
      roleStats,
      kanbanSummary: kanbanData,
      roleSpecificData
    });
  } catch (error) {
    next(error);
  }
});

// Get user's personal dashboard
router.get('/me/summary', async (req, res, next) => {
  try {
    const [
      assignedWorkUnits,
      assignedTasks,
      createdProjects,
      recentActivity
    ] = await Promise.all([
      // Assigned work units
      prisma.workUnit.findMany({
        where: {
          assignedToId: req.user.id,
          project: { companyId: req.user.companyId }
        },
        select: {
          id: true,
          name: true,
          workUnitType: true,
          status: true,
          progress: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      }),
      // Assigned tasks
      prisma.task.findMany({
        where: {
          assignedToId: req.user.id,
          project: { companyId: req.user.companyId }
        },
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          progress: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { dueDate: 'asc' }
      }),
      // Created projects
      prisma.project.findMany({
        where: {
          createdById: req.user.id,
          companyId: req.user.companyId
        },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // Recent activity (last 7 days)
      prisma.workUnit.findMany({
        where: {
          OR: [
            { assignedToId: req.user.id },
            { createdById: req.user.id }
          ],
          project: { companyId: req.user.companyId },
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
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
        take: 10
      })
    ]);

    // Calculate statistics
    const stats = {
      totalAssignedWorkUnits: assignedWorkUnits.length,
      totalAssignedTasks: assignedTasks.length,
      completedWorkUnits: assignedWorkUnits.filter(wu => wu.status === 'completed').length,
      completedTasks: assignedTasks.filter(task => task.status === 'completed').length,
      overdueWorkUnits: assignedWorkUnits.filter(wu => wu.dueDate && wu.dueDate < new Date() && wu.status !== 'completed').length,
      overdueTasks: assignedTasks.filter(task => task.dueDate && task.dueDate < new Date() && task.status !== 'completed').length,
      highPriorityTasks: assignedTasks.filter(task => task.priority === 'high').length
    };

    res.json({
      stats,
      assignedWorkUnits,
      assignedTasks,
      createdProjects,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
});

// Get company overview dashboard
router.get('/company/overview', async (req, res, next) => {
  try {
    const { timeframe = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    const [
      projectStats,
      workUnitStats,
      taskStats,
      userStats,
      recentActivity,
      topProjects
    ] = await Promise.all([
      // Project statistics
      prisma.project.groupBy({
        by: ['status'],
        where: { companyId: req.user.companyId },
        _count: { status: true }
      }),
      // Work unit statistics
      prisma.workUnit.groupBy({
        by: ['status'],
        where: {
          project: { companyId: req.user.companyId }
        },
        _count: { status: true }
      }),
      // Task statistics
      prisma.task.groupBy({
        by: ['status'],
        where: {
          project: { companyId: req.user.companyId }
        },
        _count: { status: true }
      }),
      // User statistics
      prisma.user.groupBy({
        by: ['role'],
        where: { 
          companyId: req.user.companyId,
          isActive: true
        },
        _count: { role: true }
      }),
      // Recent activity
      prisma.project.findMany({
        where: {
          companyId: req.user.companyId,
          updatedAt: { gte: startDate }
        },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),
      // Top projects by progress
      prisma.project.findMany({
        where: {
          companyId: req.user.companyId,
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          progress: true,
          startDate: true,
          endDate: true,
          _count: {
            select: {
              workUnits: true,
              tasks: true
            }
          }
        },
        orderBy: { progress: 'desc' },
        take: 5
      })
    ]);

    res.json({
      timeframe: parseInt(timeframe),
      projectStats,
      workUnitStats,
      taskStats,
      userStats,
      recentActivity,
      topProjects
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 