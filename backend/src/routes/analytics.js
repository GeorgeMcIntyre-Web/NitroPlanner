const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get company-wide analytics dashboard
router.get('/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      projectId,
      department 
    } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const projectFilter = projectId ? { projectId } : {};
    const departmentFilter = department ? { department } : {};

    // Get comprehensive analytics data
    const [
      projectStats,
      resourceUtilization,
      financialMetrics,
      qualityMetrics,
      timelineMetrics,
      rolePerformance
    ] = await Promise.all([
      getProjectStatistics(req.user.companyId, dateFilter, projectFilter),
      getResourceUtilization(req.user.companyId, dateFilter, projectFilter),
      getFinancialMetrics(req.user.companyId, dateFilter, projectFilter),
      getQualityMetrics(req.user.companyId, dateFilter, projectFilter),
      getTimelineMetrics(req.user.companyId, dateFilter, projectFilter),
      getRolePerformance(req.user.companyId, dateFilter, departmentFilter)
    ]);

    res.json({
      projectStats,
      resourceUtilization,
      financialMetrics,
      qualityMetrics,
      timelineMetrics,
      rolePerformance,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get project-specific analytics
router.get('/project/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify project belongs to user's company
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

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [
      projectMetrics,
      workUnitAnalysis,
      taskAnalysis,
      resourceAnalysis,
      costAnalysis,
      timelineAnalysis,
      qualityAnalysis,
      riskAnalysis
    ] = await Promise.all([
      getProjectMetrics(projectId, dateFilter),
      getWorkUnitAnalysis(projectId, dateFilter),
      getTaskAnalysis(projectId, dateFilter),
      getResourceAnalysis(projectId, dateFilter),
      getCostAnalysis(projectId, dateFilter),
      getTimelineAnalysis(projectId, dateFilter),
      getQualityAnalysis(projectId, dateFilter),
      getRiskAnalysis(projectId, dateFilter)
    ]);

    res.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress
      },
      metrics: {
        projectMetrics,
        workUnitAnalysis,
        taskAnalysis,
        resourceAnalysis,
        costAnalysis,
        timelineAnalysis,
        qualityAnalysis,
        riskAnalysis
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get manufacturing analytics
router.get('/manufacturing', authenticateToken, async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      projectId,
      instructionType 
    } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const projectFilter = projectId ? { projectId } : {};
    const typeFilter = instructionType ? { instructionType } : {};

    const [
      instructionStats,
      efficiencyMetrics,
      qualityMetrics,
      costMetrics,
      timeMetrics
    ] = await Promise.all([
      getManufacturingInstructionStats(req.user.companyId, dateFilter, projectFilter, typeFilter),
      getManufacturingEfficiencyMetrics(req.user.companyId, dateFilter, projectFilter),
      getManufacturingQualityMetrics(req.user.companyId, dateFilter, projectFilter),
      getManufacturingCostMetrics(req.user.companyId, dateFilter, projectFilter),
      getManufacturingTimeMetrics(req.user.companyId, dateFilter, projectFilter)
    ]);

    res.json({
      instructionStats,
      efficiencyMetrics,
      qualityMetrics,
      costMetrics,
      timeMetrics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get BOM analytics
router.get('/bom', authenticateToken, async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      projectId,
      bomType 
    } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const projectFilter = projectId ? { projectId } : {};
    const typeFilter = bomType ? { bomType } : {};

    const [
      bomStats,
      componentAnalysis,
      costAnalysis,
      supplierAnalysis,
      extractionMetrics
    ] = await Promise.all([
      getBOMStatistics(req.user.companyId, dateFilter, projectFilter, typeFilter),
      getComponentAnalysis(req.user.companyId, dateFilter, projectFilter),
      getBOMCostAnalysis(req.user.companyId, dateFilter, projectFilter),
      getSupplierAnalysis(req.user.companyId, dateFilter, projectFilter),
      getExtractionMetrics(req.user.companyId, dateFilter, projectFilter)
    ]);

    res.json({
      bomStats,
      componentAnalysis,
      costAnalysis,
      supplierAnalysis,
      extractionMetrics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Generate custom report
router.post('/report', authenticateToken, authorizeRoles(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const {
      reportType,
      filters,
      metrics,
      format,
      includeCharts
    } = req.body;

    // Validate report type
    const validReportTypes = ['project', 'manufacturing', 'bom', 'resource', 'financial', 'quality'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        error: 'Invalid report type',
        message: `Report type must be one of: ${validReportTypes.join(', ')}`
      });
    }

    // Generate report based on type
    let reportData;
    switch (reportType) {
      case 'project':
        reportData = await generateProjectReport(req.user.companyId, filters, metrics);
        break;
      case 'manufacturing':
        reportData = await generateManufacturingReport(req.user.companyId, filters, metrics);
        break;
      case 'bom':
        reportData = await generateBOMReport(req.user.companyId, filters, metrics);
        break;
      case 'resource':
        reportData = await generateResourceReport(req.user.companyId, filters, metrics);
        break;
      case 'financial':
        reportData = await generateFinancialReport(req.user.companyId, filters, metrics);
        break;
      case 'quality':
        reportData = await generateQualityReport(req.user.companyId, filters, metrics);
        break;
    }

    // Format report based on requested format
    let formattedReport;
    switch (format) {
      case 'json':
        formattedReport = reportData;
        break;
      case 'csv':
        formattedReport = convertToCSV(reportData);
        break;
      case 'pdf':
        formattedReport = await convertToPDF(reportData, includeCharts);
        break;
      default:
        formattedReport = reportData;
    }

    res.json({
      message: 'Report generated successfully',
      report: formattedReport,
      metadata: {
        reportType,
        filters,
        metrics,
        format,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.id
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions for analytics

async function getProjectStatistics(companyId, dateFilter, projectFilter) {
  const [totalProjects, activeProjects, completedProjects, delayedProjects] = await Promise.all([
    prisma.project.count({
      where: {
        companyId,
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      }
    }),
    prisma.project.count({
      where: {
        companyId,
        status: 'active',
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      }
    }),
    prisma.project.count({
      where: {
        companyId,
        status: 'completed',
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      }
    }),
    prisma.project.count({
      where: {
        companyId,
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter }),
        OR: [
          { endDate: { lt: new Date() } },
          { progress: { lt: 100 } }
        ]
      }
    })
  ]);

  return {
    total: totalProjects,
    active: activeProjects,
    completed: completedProjects,
    delayed: delayedProjects,
    completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
  };
}

async function getResourceUtilization(companyId, dateFilter, projectFilter) {
  const [totalUsers, activeUsers, workUnitStats, taskStats] = await Promise.all([
    prisma.user.count({ where: { companyId } }),
    prisma.user.count({ 
      where: { 
        companyId,
        isActive: true 
      } 
    }),
    prisma.workUnit.groupBy({
      by: ['status'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { status: true },
      _sum: { actualHours: true, estimatedHours: true }
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { status: true },
      _sum: { actualHours: true, estimatedHours: true }
    })
  ]);

  const totalEstimatedHours = workUnitStats.reduce((sum, stat) => sum + (stat._sum.estimatedHours || 0), 0);
  const totalActualHours = workUnitStats.reduce((sum, stat) => sum + (stat._sum.actualHours || 0), 0);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      utilizationRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    },
    workUnits: workUnitStats,
    tasks: taskStats,
    hours: {
      estimated: totalEstimatedHours,
      actual: totalActualHours,
      efficiency: totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0
    }
  };
}

async function getFinancialMetrics(companyId, dateFilter, projectFilter) {
  const [budgetStats, costStats] = await Promise.all([
    prisma.project.aggregate({
      where: {
        companyId,
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      },
      _sum: { budget: true }
    }),
    prisma.bOMComponent.aggregate({
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _sum: { cost: true }
    })
  ]);

  const totalBudget = budgetStats._sum.budget || 0;
  const totalCost = costStats._sum.cost || 0;

  return {
    budget: {
      total: totalBudget,
      spent: totalCost,
      remaining: totalBudget - totalCost,
      utilizationRate: totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0
    },
    costTrends: await getCostTrends(companyId, dateFilter, projectFilter)
  };
}

async function getQualityMetrics(companyId, dateFilter, projectFilter) {
  const [checkpointStats, reviewStats] = await Promise.all([
    prisma.checkpoint.groupBy({
      by: ['status'],
      where: {
        workUnit: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _count: { status: true }
    }),
    prisma.designReview.groupBy({
      by: ['status'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { status: true },
      _avg: { rating: true }
    })
  ]);

  const totalCheckpoints = checkpointStats.reduce((sum, stat) => sum + stat._count.status, 0);
  const passedCheckpoints = checkpointStats.find(stat => stat.status === 'passed')?._count.status || 0;

  return {
    checkpoints: {
      total: totalCheckpoints,
      passed: passedCheckpoints,
      failed: checkpointStats.find(stat => stat.status === 'failed')?._count.status || 0,
      passRate: totalCheckpoints > 0 ? (passedCheckpoints / totalCheckpoints) * 100 : 0
    },
    reviews: reviewStats,
    averageRating: reviewStats.reduce((sum, stat) => sum + (stat._avg.rating || 0), 0) / reviewStats.length || 0
  };
}

async function getTimelineMetrics(companyId, dateFilter, projectFilter) {
  const [projectTimelines, workUnitTimelines] = await Promise.all([
    prisma.project.findMany({
      where: {
        companyId,
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        progress: true,
        status: true
      }
    }),
    prisma.workUnit.findMany({
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        progress: true,
        status: true
      }
    })
  ]);

  const delayedProjects = projectTimelines.filter(p => 
    p.endDate && p.endDate < new Date() && p.progress < 100
  ).length;

  const onTimeProjects = projectTimelines.filter(p => 
    p.endDate && p.endDate >= new Date() || p.progress >= 100
  ).length;

  return {
    projects: {
      total: projectTimelines.length,
      delayed: delayedProjects,
      onTime: onTimeProjects,
      onTimeRate: projectTimelines.length > 0 ? (onTimeProjects / projectTimelines.length) * 100 : 0
    },
    workUnits: {
      total: workUnitTimelines.length,
      delayed: workUnitTimelines.filter(w => 
        w.endDate && w.endDate < new Date() && w.progress < 100
      ).length,
      onTime: workUnitTimelines.filter(w => 
        w.endDate && w.endDate >= new Date() || w.progress >= 100
      ).length
    },
    averageProgress: projectTimelines.length > 0 ? 
      projectTimelines.reduce((sum, p) => sum + p.progress, 0) / projectTimelines.length : 0
  };
}

async function getRolePerformance(companyId, dateFilter, departmentFilter) {
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    where: {
      companyId,
      ...departmentFilter
    },
    _count: { role: true }
  });

  const workUnitPerformance = await prisma.workUnit.groupBy({
    by: ['roleType'],
    where: {
      project: {
        companyId,
        ...(dateFilter.gte && { createdAt: dateFilter })
      }
    },
    _count: { roleType: true },
    _sum: { actualHours: true, estimatedHours: true }
  });

  return {
    roleDistribution: roleStats,
    workUnitPerformance,
    efficiencyByRole: workUnitPerformance.map(stat => ({
      role: stat.roleType,
      totalWorkUnits: stat._count.roleType,
      estimatedHours: stat._sum.estimatedHours || 0,
      actualHours: stat._sum.actualHours || 0,
      efficiency: stat._sum.estimatedHours > 0 ? 
        ((stat._sum.actualHours || 0) / stat._sum.estimatedHours) * 100 : 0
    }))
  };
}

// Project-specific analytics helpers
async function getProjectMetrics(projectId, dateFilter) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: {
          workUnits: true,
          tasks: true,
          designFiles: true,
          monteCarloSimulations: true
        }
      }
    }
  });

  const [workUnitStats, taskStats, costStats] = await Promise.all([
    prisma.workUnit.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { status: true },
      _sum: { actualHours: true, estimatedHours: true }
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { status: true },
      _sum: { actualHours: true, estimatedHours: true }
    }),
    prisma.bOMComponent.aggregate({
      where: {
        bom: { projectId }
      },
      _sum: { cost: true },
      _count: { id: true }
    })
  ]);

  return {
    project,
    workUnits: workUnitStats,
    tasks: taskStats,
    costs: {
      total: costStats._sum.cost || 0,
      componentCount: costStats._count.id
    }
  };
}

async function getWorkUnitAnalysis(projectId, dateFilter) {
  const workUnits = await prisma.workUnit.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      _count: {
        select: {
          tasks: true,
          checkpoints: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    total: workUnits.length,
    byStatus: workUnits.reduce((acc, wu) => {
      acc[wu.status] = (acc[wu.status] || 0) + 1;
      return acc;
    }, {}),
    byRole: workUnits.reduce((acc, wu) => {
      acc[wu.roleType] = (acc[wu.roleType] || 0) + 1;
      return acc;
    }, {}),
    details: workUnits
  };
}

async function getTaskAnalysis(projectId, dateFilter) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true
        }
      },
      workUnit: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    total: tasks.length,
    byStatus: tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {}),
    byKanbanColumn: tasks.reduce((acc, task) => {
      acc[task.kanbanColumn] = (acc[task.kanbanColumn] || 0) + 1;
      return acc;
    }, {}),
    details: tasks
  };
}

async function getResourceAnalysis(projectId, dateFilter) {
  const [users, workUnits] = await Promise.all([
    prisma.user.findMany({
      where: {
        assignedWorkUnits: {
          some: { projectId }
        }
      },
      include: {
        _count: {
          select: {
            assignedWorkUnits: true,
            assignedTasks: true
          }
        }
      }
    }),
    prisma.workUnit.findMany({
      where: { projectId },
      select: {
        assignedToId: true,
        estimatedHours: true,
        actualHours: true,
        progress: true
      }
    })
  ]);

  const userWorkload = users.map(user => {
    const userWorkUnits = workUnits.filter(wu => wu.assignedToId === user.id);
    const totalEstimated = userWorkUnits.reduce((sum, wu) => sum + (wu.estimatedHours || 0), 0);
    const totalActual = userWorkUnits.reduce((sum, wu) => sum + (wu.actualHours || 0), 0);
    const avgProgress = userWorkUnits.length > 0 ? 
      userWorkUnits.reduce((sum, wu) => sum + wu.progress, 0) / userWorkUnits.length : 0;

    return {
      user,
      workUnits: userWorkUnits.length,
      estimatedHours: totalEstimated,
      actualHours: totalActual,
      efficiency: totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0,
      averageProgress: avgProgress
    };
  });

  return {
    totalUsers: users.length,
    userWorkload,
    averageEfficiency: userWorkload.length > 0 ? 
      userWorkload.reduce((sum, uw) => sum + uw.efficiency, 0) / userWorkload.length : 0
  };
}

async function getCostAnalysis(projectId, dateFilter) {
  const [bomCosts, componentCosts] = await Promise.all([
    prisma.billOfMaterials.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        bomData: true
      }
    }),
    prisma.bOMComponent.findMany({
      where: {
        bom: { projectId }
      },
      select: {
        partNumber: true,
        name: true,
        cost: true,
        currency: true,
        supplier: true,
        material: true
      }
    })
  ]);

  const totalCost = componentCosts.reduce((sum, comp) => sum + (comp.cost || 0), 0);
  const costBySupplier = componentCosts.reduce((acc, comp) => {
    if (comp.supplier) {
      acc[comp.supplier] = (acc[comp.supplier] || 0) + (comp.cost || 0);
    }
    return acc;
  }, {});

  const costByMaterial = componentCosts.reduce((acc, comp) => {
    if (comp.material) {
      acc[comp.material] = (acc[comp.material] || 0) + (comp.cost || 0);
    }
    return acc;
  }, {});

  return {
    totalCost,
    bomCount: bomCosts.length,
    componentCount: componentCosts.length,
    costBySupplier,
    costByMaterial,
    averageComponentCost: componentCosts.length > 0 ? totalCost / componentCosts.length : 0
  };
}

async function getTimelineAnalysis(projectId, dateFilter) {
  const [project, workUnits, tasks] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        startDate: true,
        endDate: true,
        progress: true,
        status: true
      }
    }),
    prisma.workUnit.findMany({
      where: { projectId },
      select: {
        startDate: true,
        endDate: true,
        progress: true,
        status: true
      }
    }),
    prisma.task.findMany({
      where: { projectId },
      select: {
        startDate: true,
        endDate: true,
        progress: true,
        status: true,
        dueDate: true
      }
    })
  ]);

  const now = new Date();
  const isProjectDelayed = project.endDate && project.endDate < now && project.progress < 100;
  const delayedWorkUnits = workUnits.filter(wu => 
    wu.endDate && wu.endDate < now && wu.progress < 100
  ).length;
  const delayedTasks = tasks.filter(task => 
    task.dueDate && task.dueDate < now && task.progress < 100
  ).length;

  return {
    project: {
      isDelayed: isProjectDelayed,
      daysRemaining: project.endDate ? Math.ceil((project.endDate - now) / (1000 * 60 * 60 * 24)) : null,
      progress: project.progress
    },
    workUnits: {
      total: workUnits.length,
      delayed: delayedWorkUnits,
      onTime: workUnits.length - delayedWorkUnits
    },
    tasks: {
      total: tasks.length,
      delayed: delayedTasks,
      onTime: tasks.length - delayedTasks
    }
  };
}

async function getQualityAnalysis(projectId, dateFilter) {
  const [checkpoints, reviews] = await Promise.all([
    prisma.checkpoint.findMany({
      where: {
        workUnit: { projectId }
      },
      select: {
        status: true,
        checkpointType: true,
        completedDate: true
      }
    }),
    prisma.designReview.findMany({
      where: { projectId },
      select: {
        status: true,
        reviewType: true,
        rating: true,
        completedAt: true
      }
    })
  ]);

  const passedCheckpoints = checkpoints.filter(cp => cp.status === 'passed').length;
  const failedCheckpoints = checkpoints.filter(cp => cp.status === 'failed').length;
  const approvedReviews = reviews.filter(r => r.status === 'approved').length;
  const averageRating = reviews.length > 0 ? 
    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;

  return {
    checkpoints: {
      total: checkpoints.length,
      passed: passedCheckpoints,
      failed: failedCheckpoints,
      passRate: checkpoints.length > 0 ? (passedCheckpoints / checkpoints.length) * 100 : 0
    },
    reviews: {
      total: reviews.length,
      approved: approvedReviews,
      averageRating
    }
  };
}

async function getRiskAnalysis(projectId, dateFilter) {
  const [workUnits, tasks, checkpoints] = await Promise.all([
    prisma.workUnit.findMany({
      where: { projectId },
      select: {
        riskScore: true,
        predictedDelay: true,
        confidence: true,
        status: true
      }
    }),
    prisma.task.findMany({
      where: { projectId },
      select: {
        riskScore: true,
        predictedDelay: true,
        confidence: true,
        status: true
      }
    }),
    prisma.checkpoint.findMany({
      where: {
        workUnit: { projectId }
      },
      select: {
        status: true,
        dueDate: true
      }
    })
  ]);

  const highRiskWorkUnits = workUnits.filter(wu => wu.riskScore && wu.riskScore > 0.7).length;
  const highRiskTasks = tasks.filter(task => task.riskScore && task.riskScore > 0.7).length;
  const overdueCheckpoints = checkpoints.filter(cp => 
    cp.dueDate && cp.dueDate < new Date() && cp.status !== 'passed'
  ).length;

  return {
    workUnits: {
      total: workUnits.length,
      highRisk: highRiskWorkUnits,
      riskRate: workUnits.length > 0 ? (highRiskWorkUnits / workUnits.length) * 100 : 0
    },
    tasks: {
      total: tasks.length,
      highRisk: highRiskTasks,
      riskRate: tasks.length > 0 ? (highRiskTasks / tasks.length) * 100 : 0
    },
    checkpoints: {
      overdue: overdueCheckpoints
    }
  };
}

// Manufacturing analytics helpers
async function getManufacturingInstructionStats(companyId, dateFilter, projectFilter, typeFilter) {
  const [totalInstructions, byType, byDifficulty, byStatus] = await Promise.all([
    prisma.manufacturingInstruction.count({
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        },
        ...typeFilter
      }
    }),
    prisma.manufacturingInstruction.groupBy({
      by: ['instructionType'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { instructionType: true }
    }),
    prisma.manufacturingInstruction.groupBy({
      by: ['difficulty'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { difficulty: true }
    }),
    prisma.manufacturingInstruction.groupBy({
      by: ['status'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { status: true }
    })
  ]);

  return {
    total: totalInstructions,
    byType,
    byDifficulty,
    byStatus
  };
}

async function getManufacturingEfficiencyMetrics(companyId, dateFilter, projectFilter) {
  const instructions = await prisma.manufacturingInstruction.findMany({
    where: {
      project: {
        companyId,
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      }
    },
    select: {
      estimatedTime: true,
      instructionData: true
    }
  });

  const totalEstimatedTime = instructions.reduce((sum, inst) => sum + (inst.estimatedTime || 0), 0);
  const averageEstimatedTime = instructions.length > 0 ? totalEstimatedTime / instructions.length : 0;

  return {
    totalInstructions: instructions.length,
    totalEstimatedTime,
    averageEstimatedTime,
    efficiencyByType: await getEfficiencyByType(companyId, dateFilter, projectFilter)
  };
}

async function getManufacturingQualityMetrics(companyId, dateFilter, projectFilter) {
  const instructions = await prisma.manufacturingInstruction.findMany({
    where: {
      project: {
        companyId,
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      }
    },
    select: {
      status: true,
      instructionData: true
    }
  });

  const approvedInstructions = instructions.filter(inst => inst.status === 'approved').length;
  const draftInstructions = instructions.filter(inst => inst.status === 'draft').length;

  return {
    total: instructions.length,
    approved: approvedInstructions,
    draft: draftInstructions,
    approvalRate: instructions.length > 0 ? (approvedInstructions / instructions.length) * 100 : 0
  };
}

async function getManufacturingCostMetrics(companyId, dateFilter, projectFilter) {
  // This would integrate with cost tracking system
  return {
    totalCost: 0,
    costByType: {},
    costTrends: []
  };
}

async function getManufacturingTimeMetrics(companyId, dateFilter, projectFilter) {
  const instructions = await prisma.manufacturingInstruction.findMany({
    where: {
      project: {
        companyId,
        ...projectFilter,
        ...(dateFilter.gte && { createdAt: dateFilter })
      }
    },
    select: {
      estimatedTime: true,
      instructionType: true,
      difficulty: true
    }
  });

  const timeByType = instructions.reduce((acc, inst) => {
    acc[inst.instructionType] = (acc[inst.instructionType] || 0) + (inst.estimatedTime || 0);
    return acc;
  }, {});

  const timeByDifficulty = instructions.reduce((acc, inst) => {
    acc[inst.difficulty] = (acc[inst.difficulty] || 0) + (inst.estimatedTime || 0);
    return acc;
  }, {});

  return {
    totalEstimatedTime: instructions.reduce((sum, inst) => sum + (inst.estimatedTime || 0), 0),
    timeByType,
    timeByDifficulty,
    averageTime: instructions.length > 0 ? 
      instructions.reduce((sum, inst) => sum + (inst.estimatedTime || 0), 0) / instructions.length : 0
  };
}

// BOM analytics helpers
async function getBOMStatistics(companyId, dateFilter, projectFilter, typeFilter) {
  const [totalBOMs, byType, byStatus, extractionStats] = await Promise.all([
    prisma.billOfMaterials.count({
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        },
        ...typeFilter
      }
    }),
    prisma.billOfMaterials.groupBy({
      by: ['bomType'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { bomType: true }
    }),
    prisma.billOfMaterials.groupBy({
      by: ['status'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { status: true }
    }),
    prisma.billOfMaterials.groupBy({
      by: ['extractedFrom'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { extractedFrom: true }
    })
  ]);

  return {
    total: totalBOMs,
    byType,
    byStatus,
    extractionStats
  };
}

async function getComponentAnalysis(companyId, dateFilter, projectFilter) {
  const [totalComponents, byMaterial, bySupplier, byStatus] = await Promise.all([
    prisma.bOMComponent.count({
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      }
    }),
    prisma.bOMComponent.groupBy({
      by: ['material'],
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _count: { material: true }
    }),
    prisma.bOMComponent.groupBy({
      by: ['supplier'],
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _count: { supplier: true }
    }),
    prisma.bOMComponent.groupBy({
      by: ['status'],
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _count: { status: true }
    })
  ]);

  return {
    total: totalComponents,
    byMaterial,
    bySupplier,
    byStatus
  };
}

async function getBOMCostAnalysis(companyId, dateFilter, projectFilter) {
  const [totalCost, costByMaterial, costBySupplier] = await Promise.all([
    prisma.bOMComponent.aggregate({
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _sum: { cost: true }
    }),
    prisma.bOMComponent.groupBy({
      by: ['material'],
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _sum: { cost: true }
    }),
    prisma.bOMComponent.groupBy({
      by: ['supplier'],
      where: {
        bom: {
          project: {
            companyId,
            ...projectFilter,
            ...(dateFilter.gte && { createdAt: dateFilter })
          }
        }
      },
      _sum: { cost: true }
    })
  ]);

  return {
    totalCost: totalCost._sum.cost || 0,
    costByMaterial,
    costBySupplier
  };
}

async function getSupplierAnalysis(companyId, dateFilter, projectFilter) {
  const suppliers = await prisma.bOMComponent.groupBy({
    by: ['supplier'],
    where: {
      bom: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      }
    },
    _count: { supplier: true },
    _sum: { cost: true }
  });

  return suppliers.map(supplier => ({
    supplier: supplier.supplier,
    componentCount: supplier._count.supplier,
    totalCost: supplier._sum.cost || 0
  }));
}

async function getExtractionMetrics(companyId, dateFilter, projectFilter) {
  const [extractionJobs, successRate] = await Promise.all([
    prisma.bOMExtractionJob.groupBy({
      by: ['status'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { status: true }
    }),
    prisma.bOMExtractionJob.groupBy({
      by: ['jobType'],
      where: {
        project: {
          companyId,
          ...projectFilter,
          ...(dateFilter.gte && { createdAt: dateFilter })
        }
      },
      _count: { jobType: true }
    })
  ]);

  const totalJobs = extractionJobs.reduce((sum, job) => sum + job._count.status, 0);
  const completedJobs = extractionJobs.find(job => job.status === 'completed')?._count.status || 0;

  return {
    totalJobs,
    completedJobs,
    successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
    byStatus: extractionJobs,
    byType: successRate
  };
}

// Report generation helpers
async function generateProjectReport(companyId, filters, metrics) {
  // Implementation for project report generation
  return {
    type: 'project',
    data: {},
    charts: []
  };
}

async function generateManufacturingReport(companyId, filters, metrics) {
  // Implementation for manufacturing report generation
  return {
    type: 'manufacturing',
    data: {},
    charts: []
  };
}

async function generateBOMReport(companyId, filters, metrics) {
  // Implementation for BOM report generation
  return {
    type: 'bom',
    data: {},
    charts: []
  };
}

async function generateResourceReport(companyId, filters, metrics) {
  // Implementation for resource report generation
  return {
    type: 'resource',
    data: {},
    charts: []
  };
}

async function generateFinancialReport(companyId, filters, metrics) {
  // Implementation for financial report generation
  return {
    type: 'financial',
    data: {},
    charts: []
  };
}

async function generateQualityReport(companyId, filters, metrics) {
  // Implementation for quality report generation
  return {
    type: 'quality',
    data: {},
    charts: []
  };
}

// Utility functions
function convertToCSV(data) {
  // Implementation for CSV conversion
  return 'csv_data';
}

async function convertToPDF(data, includeCharts) {
  // Implementation for PDF conversion
  return 'pdf_data';
}

async function getCostTrends(companyId, dateFilter, projectFilter) {
  // Implementation for cost trend analysis
  return [];
}

async function getEfficiencyByType(companyId, dateFilter, projectFilter) {
  // Implementation for efficiency analysis by type
  return [];
}

module.exports = router; 