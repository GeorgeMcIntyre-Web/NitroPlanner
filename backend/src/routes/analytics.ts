import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get comprehensive analytics with predictions
router.get('/comprehensive', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { timeframe = '30', projectId } = req.query;
    const days = parseInt(timeframe as string);

    // Get historical data
    const historicalData = await getHistoricalData(req.user.companyId, days, projectId as string);
    
    // Calculate current metrics
    const currentMetrics = await calculateCurrentMetrics(req.user.companyId, projectId as string);
    
    // Generate predictions
    const predictions = generatePredictions(historicalData, currentMetrics);
    
    // Calculate efficiency trends
    const efficiencyTrends = calculateEfficiencyTrends(historicalData);
    
    // Risk assessment
    const riskAssessment = await assessRisks(req.user.companyId, projectId as string);

    res.json({
      currentMetrics,
      predictions,
      efficiencyTrends,
      riskAssessment,
      historicalData: {
        taskCompletion: historicalData.taskCompletion,
        workUnitProgress: historicalData.workUnitProgress,
        timeTracking: historicalData.timeTracking
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Get predictive analytics for specific metrics
router.get('/predictive/:metric', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { metric } = req.params;
    const { timeframe = '30', projectId } = req.query;
    const days = parseInt(timeframe as string);

    const historicalData = await getHistoricalData(req.user.companyId, days, projectId as string);
    const predictions = generateMetricPrediction(metric, historicalData);

    res.json({
      metric,
      predictions,
      confidence: calculateConfidence(historicalData, metric),
      historicalTrend: getHistoricalTrend(historicalData, metric)
    });
  } catch (error) {
    console.error('Predictive analytics error:', error);
    res.status(500).json({ error: 'Failed to generate predictive analytics' });
  }
});

// Get efficiency analytics
router.get('/efficiency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    const efficiencyData = await calculateEfficiencyMetrics(req.user.companyId, projectId as string);
    const trends = await calculateEfficiencyTrends(req.user.companyId, projectId as string);
    const predictions = predictEfficiencyImprovements(efficiencyData, trends);

    res.json({
      currentEfficiency: efficiencyData,
      trends,
      predictions,
      recommendations: generateEfficiencyRecommendations(efficiencyData, trends)
    });
  } catch (error) {
    console.error('Efficiency analytics error:', error);
    res.status(500).json({ error: 'Failed to generate efficiency analytics' });
  }
});

// Helper functions
async function getHistoricalData(companyId: string, days: number, projectId?: string) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const whereClause = {
    project: { companyId },
    ...(projectId && { projectId })
  };

  const [tasks, workUnits, timeEntries] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        estimatedHours: true,
        actualHours: true,
        startDate: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        predictedDelay: true,
        riskScore: true
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.workUnit.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        estimatedHours: true,
        actualHours: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        predictedDelay: true,
        riskScore: true,
        confidence: true
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.timeEntry.findMany({
      where: {
        task: whereClause,
        createdAt: { gte: startDate }
      },
      select: {
        id: true,
        hours: true,
        date: true,
        createdAt: true
      },
      orderBy: { date: 'asc' }
    })
  ]);

  return {
    taskCompletion: tasks.map(task => ({
      date: task.createdAt,
      completed: task.status === 'completed',
      progress: task.progress,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      delay: task.predictedDelay,
      risk: task.riskScore
    })),
    workUnitProgress: workUnits.map(wu => ({
      date: wu.createdAt,
      progress: wu.progress,
      estimatedHours: wu.estimatedHours,
      actualHours: wu.actualHours,
      delay: wu.predictedDelay,
      risk: wu.riskScore,
      confidence: wu.confidence
    })),
    timeTracking: timeEntries.map(entry => ({
      date: entry.date,
      hours: entry.hours
    }))
  };
}

async function calculateCurrentMetrics(companyId: string, projectId?: string) {
  const whereClause = {
    project: { companyId },
    ...(projectId && { projectId })
  };

  const [tasks, workUnits, projects] = await Promise.all([
    prisma.task.findMany({
      where: whereClause,
      select: {
        status: true,
        progress: true,
        estimatedHours: true,
        actualHours: true,
        priority: true,
        predictedDelay: true,
        riskScore: true
      }
    }),
    prisma.workUnit.findMany({
      where: whereClause,
      select: {
        status: true,
        progress: true,
        estimatedHours: true,
        actualHours: true,
        priority: true,
        predictedDelay: true,
        riskScore: true
      }
    }),
    prisma.project.findMany({
      where: { companyId, ...(projectId && { id: projectId }) },
      select: {
        status: true,
        progress: true,
        budget: true
      }
    })
  ]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalWorkUnits = workUnits.length;
  const completedWorkUnits = workUnits.filter(w => w.status === 'completed').length;

  const avgTaskProgress = tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length : 0;
  const avgWorkUnitProgress = workUnits.length > 0 ? workUnits.reduce((sum, w) => sum + w.progress, 0) / workUnits.length : 0;

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const efficiency = totalEstimatedHours > 0 ? totalActualHours / totalEstimatedHours : 1;

  const avgRiskScore = tasks.length > 0 ? tasks.reduce((sum, t) => sum + (t.riskScore || 0), 0) / tasks.length : 0;
  const avgDelay = tasks.length > 0 ? tasks.reduce((sum, t) => sum + (t.predictedDelay || 0), 0) / tasks.length : 0;

  return {
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      averageProgress: avgTaskProgress,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    },
    workUnits: {
      total: totalWorkUnits,
      completed: completedWorkUnits,
      inProgress: workUnits.filter(w => w.status === 'in_progress').length,
      pending: workUnits.filter(w => w.status === 'pending').length,
      averageProgress: avgWorkUnitProgress,
      completionRate: totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0
    },
    time: {
      estimatedHours: totalEstimatedHours,
      actualHours: totalActualHours,
      efficiency: efficiency,
      variance: totalEstimatedHours - totalActualHours
    },
    risk: {
      averageRiskScore: avgRiskScore,
      averageDelay: avgDelay,
      highRiskItems: tasks.filter(t => (t.riskScore || 0) > 0.7).length
    },
    projects: {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      averageProgress: projects.length > 0 ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length : 0
    }
  };
}

function generatePredictions(historicalData: any, currentMetrics: any) {
  // Simple linear regression for predictions
  const taskCompletionTrend = calculateTrend(historicalData.taskCompletion.map((t: any) => t.completed ? 1 : 0));
  const progressTrend = calculateTrend(historicalData.workUnitProgress.map((w: any) => w.progress));
  const efficiencyTrend = calculateTrend(historicalData.timeTracking.map((t: any) => t.hours));

  const daysToPredict = 30;
  
  return {
    taskCompletion: {
      predictedCompletionRate: Math.min(100, currentMetrics.tasks.completionRate + (taskCompletionTrend * daysToPredict)),
      confidence: calculateConfidence(historicalData.taskCompletion, 'completion'),
      trend: taskCompletionTrend
    },
    progress: {
      predictedProgress: Math.min(100, currentMetrics.workUnits.averageProgress + (progressTrend * daysToPredict)),
      confidence: calculateConfidence(historicalData.workUnitProgress, 'progress'),
      trend: progressTrend
    },
    efficiency: {
      predictedEfficiency: currentMetrics.time.efficiency + (efficiencyTrend * daysToPredict),
      confidence: calculateConfidence(historicalData.timeTracking, 'efficiency'),
      trend: efficiencyTrend
    },
    delays: {
      predictedDelays: Math.max(0, currentMetrics.risk.averageDelay - (taskCompletionTrend * daysToPredict)),
      confidence: calculateConfidence(historicalData.taskCompletion, 'delays'),
      trend: -taskCompletionTrend
    }
  };
}

function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  
  const n = data.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = data.reduce((sum, val) => sum + val, 0);
  const sumXY = data.reduce((sum, val, index) => sum + (index * val), 0);
  const sumX2 = data.reduce((sum, val, index) => sum + (index * index), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

function calculateConfidence(data: any[], metric: string): number {
  if (data.length < 5) return 0.5;
  
  // Calculate standard deviation and use it for confidence
  const values = data.map(d => d[metric] || d.progress || d.hours || 0);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Higher confidence for lower standard deviation
  const confidence = Math.max(0.1, Math.min(0.95, 1 - (stdDev / mean)));
  return confidence;
}

async function calculateEfficiencyMetrics(companyId: string, projectId?: string) {
  const whereClause = {
    project: { companyId },
    ...(projectId && { projectId })
  };

  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      estimatedHours: true,
      actualHours: true,
      status: true,
      priority: true
    }
  });

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalEstimated = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActual = completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

  return {
    overallEfficiency: totalEstimated > 0 ? totalActual / totalEstimated : 1,
    completedTasks: completedTasks.length,
    totalTasks: tasks.length,
    averageVariance: totalEstimated > 0 ? (totalActual - totalEstimated) / completedTasks.length : 0,
    byPriority: {
      high: calculateEfficiencyByPriority(completedTasks, 'high'),
      medium: calculateEfficiencyByPriority(completedTasks, 'medium'),
      low: calculateEfficiencyByPriority(completedTasks, 'low')
    }
  };
}

function calculateEfficiencyByPriority(tasks: any[], priority: string) {
  const priorityTasks = tasks.filter(t => t.priority === priority);
  const totalEstimated = priorityTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActual = priorityTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  
  return totalEstimated > 0 ? totalActual / totalEstimated : 1;
}

async function calculateEfficiencyTrends(companyId: string, projectId?: string) {
  // Get efficiency data over time
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasks = await prisma.task.findMany({
    where: {
      project: { companyId },
      ...(projectId && { projectId }),
      completedAt: { gte: thirtyDaysAgo }
    },
    select: {
      estimatedHours: true,
      actualHours: true,
      completedAt: true
    },
    orderBy: { completedAt: 'asc' }
  });

  // Group by week
  const weeklyData = tasks.reduce((acc: any, task) => {
    const week = getWeekNumber(task.completedAt);
    if (!acc[week]) acc[week] = [];
    acc[week].push(task);
    return acc;
  }, {});

  const trends = Object.keys(weeklyData).map(week => {
    const weekTasks = weeklyData[week];
    const totalEstimated = weekTasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0);
    const totalActual = weekTasks.reduce((sum: number, t: any) => sum + (t.actualHours || 0), 0);
    
    return {
      week,
      efficiency: totalEstimated > 0 ? totalActual / totalEstimated : 1,
      taskCount: weekTasks.length
    };
  });

  return trends;
}

function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
}

function predictEfficiencyImprovements(currentEfficiency: any, trends: any[]) {
  if (trends.length < 2) {
    return {
      predictedEfficiency: currentEfficiency.overallEfficiency,
      improvement: 0,
      confidence: 0.5
    };
  }

  const recentTrends = trends.slice(-4); // Last 4 weeks
  const efficiencyValues = recentTrends.map(t => t.efficiency);
  const trend = calculateTrend(efficiencyValues);
  
  const predictedEfficiency = currentEfficiency.overallEfficiency + (trend * 4); // 4 weeks ahead
  const improvement = predictedEfficiency - currentEfficiency.overallEfficiency;
  const confidence = calculateConfidence(efficiencyValues, 'efficiency');

  return {
    predictedEfficiency: Math.max(0.5, Math.min(2.0, predictedEfficiency)), // Reasonable bounds
    improvement,
    confidence,
    trend
  };
}

function generateEfficiencyRecommendations(currentEfficiency: any, trends: any[]) {
  const recommendations = [];

  if (currentEfficiency.overallEfficiency > 1.2) {
    recommendations.push({
      type: 'warning',
      message: 'Tasks are taking longer than estimated. Consider reviewing estimation processes.',
      priority: 'high'
    });
  }

  if (currentEfficiency.byPriority.high > 1.1) {
    recommendations.push({
      type: 'warning',
      message: 'High priority tasks are overrunning. Consider reallocating resources.',
      priority: 'high'
    });
  }

  if (trends.length > 0) {
    const recentTrend = trends[trends.length - 1];
    const previousTrend = trends[trends.length - 2];
    
    if (recentTrend && previousTrend && recentTrend.efficiency < previousTrend.efficiency) {
      recommendations.push({
        type: 'improvement',
        message: 'Efficiency has declined recently. Review recent process changes.',
        priority: 'medium'
      });
    }
  }

  if (currentEfficiency.averageVariance > 2) {
    recommendations.push({
      type: 'improvement',
      message: 'High variance in time estimates. Implement better estimation training.',
      priority: 'medium'
    });
  }

  return recommendations;
}

async function assessRisks(companyId: string, projectId?: string) {
  const whereClause = {
    project: { companyId },
    ...(projectId && { projectId })
  };

  const [tasks, workUnits] = await Promise.all([
    prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        dueDate: true,
        predictedDelay: true,
        riskScore: true,
        progress: true
      }
    }),
    prisma.workUnit.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        endDate: true,
        predictedDelay: true,
        riskScore: true,
        progress: true
      }
    })
  ]);

  const highRiskTasks = tasks.filter(t => (t.riskScore || 0) > 0.7);
  const overdueTasks = tasks.filter(t => t.dueDate && new Date() > new Date(t.dueDate) && t.status !== 'completed');
  const delayedWorkUnits = workUnits.filter(w => (w.predictedDelay || 0) > 2);

  return {
    overallRiskScore: calculateOverallRiskScore([...tasks, ...workUnits]),
    highRiskItems: highRiskTasks.length + delayedWorkUnits.length,
    overdueItems: overdueTasks.length,
    riskBreakdown: {
      tasks: {
        high: highRiskTasks.length,
        medium: tasks.filter(t => (t.riskScore || 0) > 0.4 && (t.riskScore || 0) <= 0.7).length,
        low: tasks.filter(t => (t.riskScore || 0) <= 0.4).length
      },
      workUnits: {
        high: delayedWorkUnits.length,
        medium: workUnits.filter(w => (w.predictedDelay || 0) > 1 && (w.predictedDelay || 0) <= 2).length,
        low: workUnits.filter(w => (w.predictedDelay || 0) <= 1).length
      }
    },
    recommendations: generateRiskRecommendations(highRiskTasks, overdueTasks, delayedWorkUnits)
  };
}

function calculateOverallRiskScore(items: any[]): number {
  if (items.length === 0) return 0;
  
  const totalRisk = items.reduce((sum, item) => {
    const riskScore = item.riskScore || 0;
    const delay = item.predictedDelay || 0;
    const progress = item.progress || 0;
    
    // Combine risk factors
    let combinedRisk = riskScore;
    if (delay > 0) combinedRisk += Math.min(0.3, delay / 10);
    if (progress < 50 && item.status === 'in_progress') combinedRisk += 0.2;
    
    return sum + Math.min(1, combinedRisk);
  }, 0);
  
  return totalRisk / items.length;
}

function generateRiskRecommendations(highRiskTasks: any[], overdueTasks: any[], delayedWorkUnits: any[]) {
  const recommendations = [];

  if (highRiskTasks.length > 0) {
    recommendations.push({
      type: 'risk',
      message: `${highRiskTasks.length} high-risk tasks identified. Review and reallocate resources.`,
      priority: 'high',
      items: highRiskTasks.map(t => ({ id: t.id, name: t.name, riskScore: t.riskScore }))
    });
  }

  if (overdueTasks.length > 0) {
    recommendations.push({
      type: 'overdue',
      message: `${overdueTasks.length} overdue tasks. Prioritize completion or update deadlines.`,
      priority: 'high',
      items: overdueTasks.map(t => ({ id: t.id, name: t.name, dueDate: t.dueDate }))
    });
  }

  if (delayedWorkUnits.length > 0) {
    recommendations.push({
      type: 'delay',
      message: `${delayedWorkUnits.length} work units are delayed. Review dependencies and resource allocation.`,
      priority: 'medium',
      items: delayedWorkUnits.map(w => ({ id: w.id, name: w.name, delay: w.predictedDelay }))
    });
  }

  return recommendations;
}

export default router; 