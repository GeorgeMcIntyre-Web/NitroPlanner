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

    // Get all work units with dependencies
    const workUnits = await prisma.workUnit.findMany({
      where: { projectId },
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

    res.json({
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
    next(error);
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

    // Get process template
    const template = await prisma.processTemplate.findFirst({
      where: {
        id: templateId,
        companyId: req.user.companyId,
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
      projectId,
      template,
      customizations,
      req.user.id
    );

    res.status(201).json({
      message: 'Workflow created successfully from template',
      workUnits: createdWorkUnits,
      template: {
        id: template.id,
        name: template.name,
        description: template.description
      }
    });
  } catch (error) {
    next(error);
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

    // Validate dependencies
    const validDependencies = await validateDependencies(dependencies, req.user.companyId);
    if (!validDependencies.valid) {
      return res.status(400).json({
        error: 'Invalid dependencies',
        message: validDependencies.errors.join(', ')
      });
    }

    // Update work unit dependencies
    const updatedWorkUnit = await prisma.workUnit.update({
      where: { id: workUnitId },
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

    res.json({
      message: 'Work unit dependencies updated successfully',
      workUnit: updatedWorkUnit
    });
  } catch (error) {
    next(error);
  }
});

// Get workflow analytics
router.get('/analytics/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;

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

    // Get workflow analytics
    const analytics = await calculateWorkflowAnalytics(projectId);

    res.json({
      project: {
        id: project.id,
        name: project.name
      },
      analytics
    });
  } catch (error) {
    next(error);
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

    // Run workflow simulation
    const simulationResults = await runWorkflowSimulation(projectId, simulationParams);

    res.json({
      message: 'Workflow simulation completed',
      simulation: simulationResults
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to build dependency graph
function buildDependencyGraph(workUnits) {
  const graph = {
    nodes: workUnits.map(wu => ({
      id: wu.id,
      name: wu.name,
      status: wu.status,
      progress: wu.progress,
      estimatedHours: wu.estimatedHours,
      actualHours: wu.actualHours,
      startDate: wu.startDate,
      endDate: wu.endDate
    })),
    edges: []
  };

  workUnits.forEach(workUnit => {
    if (workUnit.dependencies && Array.isArray(workUnit.dependencies)) {
      workUnit.dependencies.forEach(depId => {
        graph.edges.push({
          from: depId,
          to: workUnit.id,
          type: 'finish_to_start'
        });
      });
    }
  });

  return graph;
}

// Helper function to calculate critical path
function calculateCriticalPath(dependencyGraph) {
  const nodes = dependencyGraph.nodes;
  const edges = dependencyGraph.edges;
  
  // Create adjacency list
  const adjacencyList = {};
  const inDegree = {};
  
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
    inDegree[node.id] = 0;
  });
  
  edges.forEach(edge => {
    adjacencyList[edge.from].push(edge.to);
    inDegree[edge.to]++;
  });
  
  // Topological sort with longest path calculation
  const queue = [];
  const earliestStart = {};
  const latestStart = {};
  
  nodes.forEach(node => {
    earliestStart[node.id] = 0;
    if (inDegree[node.id] === 0) {
      queue.push(node.id);
    }
  });
  
  // Calculate earliest start times
  while (queue.length > 0) {
    const current = queue.shift();
    const node = nodes.find(n => n.id === current);
    
    adjacencyList[current].forEach(neighbor => {
      const neighborNode = nodes.find(n => n.id === neighbor);
      const duration = neighborNode.estimatedHours || 0;
      earliestStart[neighbor] = Math.max(
        earliestStart[neighbor],
        earliestStart[current] + duration
      );
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  // Calculate latest start times
  const maxDuration = Math.max(...Object.values(earliestStart));
  nodes.forEach(node => {
    latestStart[node.id] = maxDuration;
  });
  
  // Find critical path
  const criticalPath = [];
  const criticalNodes = new Set();
  
  nodes.forEach(node => {
    if (earliestStart[node.id] === latestStart[node.id]) {
      criticalNodes.add(node.id);
      criticalPath.push({
        id: node.id,
        name: node.name,
        duration: node.estimatedHours || 0,
        earliestStart: earliestStart[node.id],
        latestStart: latestStart[node.id]
      });
    }
  });
  
  return {
    path: criticalPath,
    totalDuration: maxDuration,
    criticalNodes: Array.from(criticalNodes)
  };
}

// Helper function to calculate workflow metrics
function calculateWorkflowMetrics(workUnits, dependencyGraph) {
  const totalWorkUnits = workUnits.length;
  const completedWorkUnits = workUnits.filter(wu => wu.status === 'completed').length;
  const inProgressWorkUnits = workUnits.filter(wu => wu.status === 'in_progress').length;
  const pendingWorkUnits = workUnits.filter(wu => wu.status === 'pending').length;
  
  const totalEstimatedHours = workUnits.reduce((sum, wu) => sum + (wu.estimatedHours || 0), 0);
  const totalActualHours = workUnits.reduce((sum, wu) => sum + (wu.actualHours || 0), 0);
  
  const avgProgress = workUnits.length > 0 
    ? workUnits.reduce((sum, wu) => sum + wu.progress, 0) / workUnits.length 
    : 0;
  
  const dependencyCount = dependencyGraph.edges.length;
  const avgDependenciesPerWorkUnit = totalWorkUnits > 0 ? dependencyCount / totalWorkUnits : 0;
  
  return {
    totalWorkUnits,
    completedWorkUnits,
    inProgressWorkUnits,
    pendingWorkUnits,
    completionRate: totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0,
    totalEstimatedHours,
    totalActualHours,
    efficiency: totalEstimatedHours > 0 ? (totalEstimatedHours / totalActualHours) * 100 : 0,
    avgProgress,
    dependencyCount,
    avgDependenciesPerWorkUnit
  };
}

// Helper function to create work units from template
async function createWorkUnitsFromTemplate(projectId, template, customizations, createdById) {
  const templateData = template.templateData;
  const workUnits = [];
  
  if (templateData.workUnits && Array.isArray(templateData.workUnits)) {
    for (const workUnitTemplate of templateData.workUnits) {
      const workUnit = await prisma.workUnit.create({
        data: {
          projectId,
          name: workUnitTemplate.name,
          description: workUnitTemplate.description,
          workUnitType: workUnitTemplate.workUnitType || template.workUnitType,
          roleType: workUnitTemplate.roleType || template.roleType,
          priority: workUnitTemplate.priority || 'medium',
          estimatedHours: workUnitTemplate.estimatedHours,
          dependencies: workUnitTemplate.dependencies || [],
          createdById
        }
      });
      
      // Create checkpoints if defined in template
      if (workUnitTemplate.checkpoints && Array.isArray(workUnitTemplate.checkpoints)) {
        for (const checkpointTemplate of workUnitTemplate.checkpoints) {
          await prisma.checkpoint.create({
            data: {
              workUnitId: workUnit.id,
              name: checkpointTemplate.name,
              description: checkpointTemplate.description,
              checkpointType: checkpointTemplate.type,
              requiredRole: checkpointTemplate.requiredRole,
              status: 'pending'
            }
          });
        }
      }
      
      workUnits.push(workUnit);
    }
  }
  
  return workUnits;
}

// Helper function to validate dependencies
async function validateDependencies(dependencies, companyId) {
  const errors = [];
  
  if (!Array.isArray(dependencies)) {
    errors.push('Dependencies must be an array');
    return { valid: false, errors };
  }
  
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
async function calculateWorkflowAnalytics(projectId) {
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
  
  const analytics = {
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
    .filter(wu => wu.estimatedHours)
    .map(wu => wu.estimatedHours);
  
  if (durations.length > 0) {
    analytics.timeline.totalDuration = durations.reduce((sum, d) => sum + d, 0);
    analytics.timeline.avgDuration = analytics.timeline.totalDuration / durations.length;
    analytics.timeline.longestWorkUnit = workUnits.find(wu => wu.estimatedHours === Math.max(...durations));
    analytics.timeline.shortestWorkUnit = workUnits.find(wu => wu.estimatedHours === Math.min(...durations));
  }
  
  // Calculate quality analytics
  const allCheckpoints = workUnits.flatMap(wu => wu.checkpoints);
  analytics.quality.totalCheckpoints = allCheckpoints.length;
  analytics.quality.passedCheckpoints = allCheckpoints.filter(cp => cp.status === 'passed').length;
  analytics.quality.failedCheckpoints = allCheckpoints.filter(cp => cp.status === 'failed').length;
  analytics.quality.qualityScore = analytics.quality.totalCheckpoints > 0 
    ? (analytics.quality.passedCheckpoints / analytics.quality.totalCheckpoints) * 100 
    : 0;
  
  // Calculate efficiency analytics
  analytics.efficiency.totalEstimatedHours = workUnits.reduce((sum, wu) => sum + (wu.estimatedHours || 0), 0);
  analytics.efficiency.totalActualHours = workUnits.reduce((sum, wu) => sum + (wu.actualHours || 0), 0);
  analytics.efficiency.efficiencyScore = analytics.efficiency.totalEstimatedHours > 0 
    ? (analytics.efficiency.totalEstimatedHours / analytics.efficiency.totalActualHours) * 100 
    : 0;
  
  // Calculate team analytics
  const assignments = workUnits.filter(wu => wu.assignedTo);
  analytics.team.totalAssignments = assignments.length;
  
  const memberWorkloads = {};
  assignments.forEach(wu => {
    const memberId = wu.assignedTo.id;
    memberWorkloads[memberId] = (memberWorkloads[memberId] || 0) + (wu.estimatedHours || 0);
  });
  
  if (Object.keys(memberWorkloads).length > 0) {
    const workloads = Object.values(memberWorkloads);
    analytics.team.avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    
    const maxWorkload = Math.max(...workloads);
    const minWorkload = Math.min(...workloads);
    
    analytics.team.busiestMember = assignments.find(wu => 
      wu.assignedTo && memberWorkloads[wu.assignedTo.id] === maxWorkload
    )?.assignedTo;
    
    analytics.team.leastBusyMember = assignments.find(wu => 
      wu.assignedTo && memberWorkloads[wu.assignedTo.id] === minWorkload
    )?.assignedTo;
  }
  
  return analytics;
}

// Helper function to run workflow simulation
async function runWorkflowSimulation(projectId, simulationParams) {
  const workUnits = await prisma.workUnit.findMany({
    where: { projectId },
    include: {
      assignedTo: true,
      checkpoints: true
    }
  });
  
  const iterations = simulationParams?.iterations || 1000;
  const results = {
    iterations,
    completionTimes: [],
    riskAnalysis: {},
    recommendations: []
  };
  
  // Monte Carlo simulation
  for (let i = 0; i < iterations; i++) {
    const completionTime = simulateWorkflowExecution(workUnits, simulationParams);
    results.completionTimes.push(completionTime);
  }
  
  // Calculate statistics
  results.completionTimes.sort((a, b) => a - b);
  const mean = results.completionTimes.reduce((sum, t) => sum + t, 0) / iterations;
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
    highRiskThreshold: p95,
    mediumRiskThreshold: p90,
    lowRiskThreshold: median,
    riskLevel: p95 > simulationParams?.targetDuration ? 'high' : 
               p90 > simulationParams?.targetDuration ? 'medium' : 'low'
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
function simulateWorkflowExecution(workUnits, simulationParams) {
  // Simplified simulation - in a real implementation, this would be much more sophisticated
  const baseDurations = workUnits.map(wu => wu.estimatedHours || 0);
  const variability = simulationParams?.variability || 0.2;
  
  let totalDuration = 0;
  baseDurations.forEach(duration => {
    // Add random variability
    const variation = (Math.random() - 0.5) * 2 * variability;
    const actualDuration = duration * (1 + variation);
    totalDuration += Math.max(0, actualDuration);
  });
  
  return totalDuration;
}

export default router; 