import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get workflow for a project
router.get('/project/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId as string,
        companyId: (req as any).user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    // Get all work units with dependencies
    const workUnits = await prisma.workUnit.findMany({
      where: { projectId: projectId as string },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        checkpoints: {
          orderBy: { createdAt: 'asc' }
        },
        tasks: {
          include: {
            taskDependencies: {
              include: {
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
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Build dependency graph
    const dependencyGraph = buildDependencyGraph(workUnits);
    
    // Calculate critical path
    const criticalPath = calculateCriticalPath(dependencyGraph);
    
    // Calculate workflow metrics
    const workflowMetrics = calculateWorkflowMetrics(workUnits, dependencyGraph);

    return res.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status
      },
      workUnits,
      dependencyGraph,
      criticalPath,
      metrics: workflowMetrics
    });
  } catch (error) {
    return next(error);
  }
});

// Create workflow from template
router.post('/create-from-template/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { templateId, customizations } = req.body;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId as string,
        companyId: (req as any).user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    // Get process template
    const template = await prisma.processTemplate.findFirst({
      where: {
        id: templateId as string,
        companyId: (req as any).user.companyId,
        isActive: true
      }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        message: 'Process template not found'
      });
    }

    // Create work units from template
    const createdWorkUnits = await createWorkUnitsFromTemplate(
      projectId as string,
      template,
      customizations,
      (req as any).user.id
    );

    return res.status(201).json({
      message: 'Workflow created successfully from template',
      workUnits: createdWorkUnits,
      template: {
        id: template.id,
        name: template.name,
        description: template.description
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Update workflow dependencies
router.put('/dependencies/:workUnitId', authenticateToken, async (req, res, next) => {
  try {
    const { workUnitId } = req.params;
    const { dependencies } = req.body;

    // Verify work unit belongs to user's company
    const workUnit = await prisma.workUnit.findFirst({
      where: {
        id: workUnitId as string,
        project: {
          companyId: (req as any).user.companyId
        }
      }
    });

    if (!workUnit) {
      return res.status(404).json({
        error: 'Work unit not found',
        message: 'Work unit not found in your company'
      });
    }

    // Validate dependencies
    const validDependencies = await validateDependencies(dependencies, (req as any).user.companyId);
    if (!validDependencies.valid) {
      return res.status(400).json({
        error: 'Invalid dependencies',
        message: validDependencies.errors.join(', ')
      });
    }

    // Update work unit dependencies
    const updatedWorkUnit = await prisma.workUnit.update({
      where: { id: workUnitId as string },
      data: {
        dependencies: dependencies,
        updatedAt: new Date()
      },
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

    return res.json({
      message: 'Work unit dependencies updated successfully',
      workUnit: updatedWorkUnit
    });
  } catch (error) {
    return next(error);
  }
});

// Get workflow analytics
router.get('/analytics/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId as string,
        companyId: (req as any).user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    // Get workflow analytics
    const analytics = await calculateWorkflowAnalytics(projectId as string);

    return res.json({
      project: {
        id: project.id,
        name: project.name
      },
      analytics
    });
  } catch (error) {
    return next(error);
  }
});

// Simulate workflow
router.post('/simulate/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { simulationParams } = req.body;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId as string,
        companyId: (req as any).user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    // Run workflow simulation
    const simulationResults = await runWorkflowSimulation(projectId as string, simulationParams);

    return res.json({
      message: 'Workflow simulation completed',
      simulation: simulationResults
    });
  } catch (error) {
    return next(error);
  }
});

// Helper function to build dependency graph
function buildDependencyGraph(workUnits: any[]): any {
  const graph = {
    nodes: workUnits.map((wu: any) => ({
      id: wu.id,
      name: wu.name,
      estimatedHours: wu.estimatedHours || 0
    })),
    edges: [] as any[]
  };

  workUnits.forEach((wu: any) => {
    if (wu.dependencies && Array.isArray(wu.dependencies)) {
      wu.dependencies.forEach((depId: any) => {
        graph.edges.push({
          from: depId,
          to: wu.id,
          type: 'finish_to_start'
        } as any);
      });
    }
  });

  return graph;
}

// Helper function to calculate critical path
function calculateCriticalPath(dependencyGraph: any): any {
  const nodes = dependencyGraph.nodes;
  const edges = dependencyGraph.edges;

  const adjacencyList: { [key: string]: string[] } = {};
  const inDegree: { [key: string]: number } = {};

  nodes.forEach((node: any) => {
    adjacencyList[node.id] = [];
    inDegree[node.id] = 0;
  });

  edges.forEach((edge: any) => {
    const fromKey = edge.from as string;
    const toKey = edge.to as string;
    if (adjacencyList[fromKey]) {
      adjacencyList[fromKey].push(toKey);
    }
    if (inDegree[toKey] !== undefined) {
      inDegree[toKey]++;
    }
  });

  const queue: string[] = [];
  const earliestStart: { [key: string]: number } = {};
  const latestStart: { [key: string]: number } = {};

  nodes.forEach((node: any) => {
    earliestStart[node.id] = 0;
    if (inDegree[node.id] === 0) {
      queue.push(node.id);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const node = nodes.find((n: any) => n.id === current);
    if (!node) continue;
    (adjacencyList[current] || []).forEach((neighbor: string) => {
      const neighborNode = nodes.find((n: any) => n.id === neighbor);
      const duration = neighborNode?.estimatedHours || 0;
      earliestStart[neighbor] = Math.max(
        earliestStart[neighbor] ?? 0,
        earliestStart[current] + duration
      );
      if (inDegree[neighbor] !== undefined) {
        inDegree[neighbor]--;
      }
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  const maxDuration = Math.max(...Object.values(earliestStart));
  nodes.forEach((node: any) => {
    latestStart[node.id] = maxDuration;
  });

  const criticalPath: string[] = [];
  const criticalNodes = new Set<string>();

  nodes.forEach((node: any) => {
    if (earliestStart[node.id] === latestStart[node.id]) {
      criticalNodes.add(node.id);
    }
  });

  // Build the critical path sequence
  let currentNode = nodes.find((node: any) => inDegree[node.id] === 0 && criticalNodes.has(node.id));
  while (currentNode) {
    criticalPath.push(currentNode.id);
    const next = (adjacencyList[currentNode.id] || []).find(
      (neighbor: string) => criticalNodes.has(neighbor)
    );
    if (!next) break;
    currentNode = nodes.find((node: any) => node.id === next);
  }

  return {
    criticalPath,
    duration: maxDuration
  };
}

// Helper function to calculate workflow metrics
function calculateWorkflowMetrics(workUnits: any[], dependencyGraph: any) {
  const totalWorkUnits = workUnits.length;
  const completedWorkUnits = workUnits.filter(wu => wu.status === 'completed').length;
  const inProgressWorkUnits = workUnits.filter(wu => wu.status === 'in_progress').length;
  const pendingWorkUnits = workUnits.filter(wu => wu.status === 'pending').length;
  
  const totalEstimatedHours = workUnits.reduce((sum, wu) => sum + (wu.estimatedHours || 0), 0);
  const totalActualHours = workUnits.reduce((sum, wu) => sum + (wu.actualHours || 0), 0);
  
  const avgProgress = workUnits.length > 0 
    ? workUnits.reduce((sum, wu) => sum + (wu.progress || 0), 0) / workUnits.length 
    : 0;
  
  const dependencyCount = dependencyGraph.edges.length;
  const avgDependenciesPerWorkUnit = totalWorkUnits > 0 ? dependencyCount / totalWorkUnits : 0;
  
  return {
    totalWorkUnits,
    completedWorkUnits,
    inProgressWorkUnits,
    pendingWorkUnits,
    totalEstimatedHours,
    totalActualHours,
    avgProgress,
    dependencyCount,
    avgDependenciesPerWorkUnit
  };
}

// Helper function to create work units from template
async function createWorkUnitsFromTemplate(projectId: string, template: any, customizations: any, createdById: string) {
  const workUnits = template.workUnits || [];
  const createdWorkUnits = [];

  for (const templateWorkUnit of workUnits) {
    const workUnitData = {
      name: templateWorkUnit.name,
      description: templateWorkUnit.description,
      workUnitType: templateWorkUnit.workUnitType || template.workUnitType,
      roleType: templateWorkUnit.roleType || template.roleType,
      estimatedHours: templateWorkUnit.estimatedHours,
      status: 'pending',
      priority: templateWorkUnit.priority || 'medium',
      projectId,
      createdById,
      dependencies: templateWorkUnit.dependencies || [],
      checkpoints: {
        create: templateWorkUnit.checkpoints?.map((cp: any) => ({
          name: cp.name,
          description: cp.description,
          checkpointType: cp.checkpointType || 'quality_gate',
          status: 'pending'
        })) || []
      }
    };

    const createdWorkUnit = await prisma.workUnit.create({
      data: workUnitData,
      include: {
        checkpoints: true
      }
    });

    createdWorkUnits.push(createdWorkUnit);
  }

  return createdWorkUnits;
}

// Helper function to validate dependencies
async function validateDependencies(dependencies: string[], companyId: string) {
  const errors: string[] = [];
  
  for (const depId of dependencies) {
    const workUnit = await prisma.workUnit.findFirst({
      where: {
        id: depId,
        project: {
          companyId
        }
      }
    });
    
    if (!workUnit) {
      errors.push(`Work unit ${depId} not found`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper function to calculate workflow analytics
async function calculateWorkflowAnalytics(projectId: string) {
  const workUnits = await prisma.workUnit.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      checkpoints: true,
      tasks: true
    }
  });
  
  const analytics: any = {
    timeline: {
      totalDuration: 0,
      avgDuration: 0,
      longestWorkUnit: null,
      shortestWorkUnit: null
    },
    quality: {
      totalCheckpoints: 0,
      passedCheckpoints: 0,
      failedCheckpoints: 0,
      qualityScore: 0
    },
    efficiency: {
      totalEstimatedHours: 0,
      totalActualHours: 0,
      efficiencyScore: 0,
      overruns: 0,
      underruns: 0
    },
    team: {
      totalAssignments: 0,
      avgWorkload: 0,
      busiestMember: null,
      leastBusyMember: null
    }
  };
  
  // Calculate timeline analytics
  const durations = workUnits
    .filter((wu: any) => wu.estimatedHours)
    .map((wu: any) => wu.estimatedHours as number);
  
  if (durations.length > 0) {
    analytics.timeline.totalDuration = durations.reduce((sum: number, d: number) => sum + d, 0);
    analytics.timeline.avgDuration = analytics.timeline.totalDuration / durations.length;
    analytics.timeline.longestWorkUnit = workUnits.find((wu: any) => wu.estimatedHours === Math.max(...durations)) || null;
    analytics.timeline.shortestWorkUnit = workUnits.find((wu: any) => wu.estimatedHours === Math.min(...durations)) || null;
  }
  
  // Calculate quality analytics
  const allCheckpoints = workUnits.flatMap((wu: any) => wu.checkpoints);
  analytics.quality.totalCheckpoints = allCheckpoints.length;
  analytics.quality.passedCheckpoints = allCheckpoints.filter((cp: any) => cp.status === 'passed').length;
  analytics.quality.failedCheckpoints = allCheckpoints.filter((cp: any) => cp.status === 'failed').length;
  analytics.quality.qualityScore = analytics.quality.totalCheckpoints > 0 
    ? (analytics.quality.passedCheckpoints / analytics.quality.totalCheckpoints) * 100 
    : 0;
  
  // Calculate efficiency analytics
  analytics.efficiency.totalEstimatedHours = workUnits.reduce((sum: number, wu: any) => sum + (wu.estimatedHours || 0), 0);
  analytics.efficiency.totalActualHours = workUnits.reduce((sum: number, wu: any) => sum + (wu.actualHours || 0), 0);
  analytics.efficiency.efficiencyScore = analytics.efficiency.totalActualHours > 0 
    ? (analytics.efficiency.totalEstimatedHours / analytics.efficiency.totalActualHours) * 100 
    : 0;
  
  // Calculate team analytics
  const assignments = workUnits.filter((wu: any) => wu.assignedTo);
  analytics.team.totalAssignments = assignments.length;
  
  const memberWorkloads: Record<string, number> = {};
  assignments.forEach((wu: any) => {
    const memberId = wu.assignedTo.id;
    memberWorkloads[memberId] = (memberWorkloads[memberId] || 0) + (wu.estimatedHours || 0);
  });
  
  if (Object.keys(memberWorkloads).length > 0) {
    const workloads = Object.values(memberWorkloads);
    analytics.team.avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    
    const maxWorkload = Math.max(...workloads);
    const minWorkload = Math.min(...workloads);
    
    analytics.team.busiestMember = assignments.find((wu: any) => 
      wu.assignedTo && memberWorkloads[wu.assignedTo.id] === maxWorkload
    )?.assignedTo || null;
    
    analytics.team.leastBusyMember = assignments.find((wu: any) => 
      wu.assignedTo && memberWorkloads[wu.assignedTo.id] === minWorkload
    )?.assignedTo || null;
  }
  
  return analytics;
}

// Helper function to run workflow simulation
async function runWorkflowSimulation(projectId: string, simulationParams: any) {
  const workUnits = await prisma.workUnit.findMany({
    where: { projectId },
    include: {
      assignedTo: true,
      checkpoints: true
    }
  });
  
  const iterations = simulationParams?.iterations || 1000;
  const results: any = {
    iterations,
    completionTimes: [] as number[],
    riskAnalysis: {} as any,
    recommendations: [] as string[]
  };
  
  // Monte Carlo simulation
  for (let i = 0; i < iterations; i++) {
    const completionTime = simulateWorkflowExecution(workUnits, simulationParams);
    results.completionTimes.push(completionTime);
  }
  
  // Calculate statistics
  results.completionTimes.sort((a: number, b: number) => a - b);
  const mean = results.completionTimes.reduce((sum: number, t: number) => sum + t, 0) / iterations;
  const median = results.completionTimes[Math.floor(iterations / 2)];
  const p90 = results.completionTimes[Math.floor(iterations * 0.9)];
  const p95 = results.completionTimes[Math.floor(iterations * 0.95)];
  
  results.statistics = {
    mean,
    median,
    p90,
    p95,
    min: results.completionTimes[0],
    max: results.completionTimes[iterations - 1]
  };
  
  // Risk analysis
  results.riskAnalysis = {
    highRiskThreshold: p95 && p95 > (simulationParams?.targetDuration ?? 0) ? p95 : undefined,
    mediumRiskThreshold: p90 && p90 > (simulationParams?.targetDuration ?? 0) ? p90 : undefined,
    lowRiskThreshold: median,
    riskLevel: p95 && p95 > (simulationParams?.targetDuration ?? 0) ? 'high' : 
               p90 && p90 > (simulationParams?.targetDuration ?? 0) ? 'medium' : 'low'
  };
  
  // Generate recommendations
  if (results.riskAnalysis.riskLevel === 'high') {
    results.recommendations.push('Consider adding more resources to critical path work units');
    results.recommendations.push('Review and optimize dependencies to reduce bottlenecks');
    results.recommendations.push('Implement parallel work streams where possible');
  }
  
  return results;
}

// Helper function to simulate workflow execution
function simulateWorkflowExecution(workUnits: any[], simulationParams: any): number {
  // Simplified simulation - in a real implementation, this would be much more sophisticated
  const baseDurations = workUnits.map((wu: any) => wu.estimatedHours || 0);
  const variability = simulationParams?.variability || 0.2;
  
  let totalDuration = 0;
  baseDurations.forEach((duration: number) => {
    // Add random variability
    const variation = (Math.random() - 0.5) * 2 * variability;
    const actualDuration = duration * (1 + variation);
    totalDuration += Math.max(0, actualDuration);
  });
  
  return totalDuration;
}

export default router; 