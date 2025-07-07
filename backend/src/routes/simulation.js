const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Run Monte Carlo simulation for project
router.post('/monte-carlo/:projectId', [
  body('iterations').optional().isInt({ min: 1000, max: 50000 }),
  body('confidenceLevel').optional().isFloat({ min: 0.8, max: 0.99 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { projectId } = req.params;
    const { iterations = 10000, confidenceLevel = 0.95 } = req.body;

    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: req.user.companyId
      },
      include: {
        workUnits: {
          select: {
            id: true,
            name: true,
            estimatedHours: true,
            actualHours: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        tasks: {
          select: {
            id: true,
            name: true,
            estimatedHours: true,
            actualHours: true,
            startDate: true,
            endDate: true,
            status: true,
            dependencies: true
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

    // Simple Monte Carlo simulation
    const simulationResults = runMonteCarloSimulation(project, iterations, confidenceLevel);

    // Save simulation results
    const simulation = await prisma.monteCarloSimulation.create({
      data: {
        projectId,
        iterations,
        results: simulationResults,
        confidenceIntervals: {
          p50: simulationResults.percentiles[50],
          p80: simulationResults.percentiles[80],
          p90: simulationResults.percentiles[90],
          p95: simulationResults.percentiles[95]
        }
      }
    });

    res.json({
      message: 'Monte Carlo simulation completed',
      simulation: {
        id: simulation.id,
        iterations,
        results: simulationResults,
        confidenceIntervals: simulation.confidenceIntervals
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get simulation history for project
router.get('/history/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 10 } = req.query;

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

    const simulations = await prisma.monteCarloSimulation.findMany({
      where: { projectId },
      select: {
        id: true,
        simulationDate: true,
        iterations: true,
        results: true,
        confidenceIntervals: true
      },
      orderBy: { simulationDate: 'desc' },
      take: parseInt(limit)
    });

    res.json(simulations);
  } catch (error) {
    next(error);
  }
});

// Get AI predictions for tasks
router.post('/predict/tasks', [
  body('taskIds').isArray(),
  body('taskIds.*').isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { taskIds } = req.body;

    // Get tasks and verify they belong to company
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        project: { companyId: req.user.companyId }
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
            role: true
          }
        },
        workUnit: {
          select: {
            id: true,
            name: true,
            workUnitType: true
          }
        }
      }
    });

    if (tasks.length !== taskIds.length) {
      return res.status(404).json({
        error: 'Some tasks not found',
        message: 'One or more tasks not found in your company'
      });
    }

    // Generate AI predictions
    const predictions = tasks.map(task => {
      const prediction = generateTaskPrediction(task);
      
      // Update task with prediction
      prisma.task.update({
        where: { id: task.id },
        data: {
          predictedDelay: prediction.predictedDelay,
          riskScore: prediction.riskScore,
          confidence: prediction.confidence
        }
      });

      return {
        taskId: task.id,
        taskName: task.name,
        prediction
      };
    });

    await Promise.all(predictions.map(p => p.updatePromise));

    res.json({
      message: 'AI predictions generated successfully',
      predictions: predictions.map(p => ({
        taskId: p.taskId,
        taskName: p.taskName,
        prediction: p.prediction
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get AI predictions for work units
router.post('/predict/work-units', [
  body('workUnitIds').isArray(),
  body('workUnitIds.*').isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workUnitIds } = req.body;

    // Get work units and verify they belong to company
    const workUnits = await prisma.workUnit.findMany({
      where: {
        id: { in: workUnitIds },
        project: { companyId: req.user.companyId }
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
            role: true
          }
        }
      }
    });

    if (workUnits.length !== workUnitIds.length) {
      return res.status(404).json({
        error: 'Some work units not found',
        message: 'One or more work units not found in your company'
      });
    }

    // Generate AI predictions
    const predictions = workUnits.map(workUnit => {
      const prediction = generateWorkUnitPrediction(workUnit);
      
      // Update work unit with prediction
      prisma.workUnit.update({
        where: { id: workUnit.id },
        data: {
          predictedDelay: prediction.predictedDelay,
          riskScore: prediction.riskScore,
          confidence: prediction.confidence
        }
      });

      return {
        workUnitId: workUnit.id,
        workUnitName: workUnit.name,
        prediction
      };
    });

    await Promise.all(predictions.map(p => p.updatePromise));

    res.json({
      message: 'AI predictions generated successfully',
      predictions: predictions.map(p => ({
        workUnitId: p.workUnitId,
        workUnitName: p.workUnitName,
        prediction: p.prediction
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to run Monte Carlo simulation
function runMonteCarloSimulation(project, iterations, confidenceLevel) {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    let totalDuration = 0;
    
    // Simulate each work unit
    project.workUnits.forEach(workUnit => {
      if (workUnit.status !== 'completed') {
        // Add some randomness to estimated hours
        const baseHours = workUnit.estimatedHours || 40;
        const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variation
        totalDuration += baseHours * randomFactor;
      }
    });
    
    results.push(totalDuration);
  }
  
  // Calculate statistics
  results.sort((a, b) => a - b);
  
  const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
  const median = results[Math.floor(results.length / 2)];
  const p80 = results[Math.floor(results.length * 0.8)];
  const p90 = results[Math.floor(results.length * 0.9)];
  const p95 = results[Math.floor(results.length * 0.95)];
  
  return {
    mean,
    median,
    percentiles: {
      50: median,
      80: p80,
      90: p90,
      95: p95
    },
    min: results[0],
    max: results[results.length - 1],
    iterations
  };
}

// Helper function to generate task prediction
function generateTaskPrediction(task) {
  // Simple prediction algorithm
  const baseDelay = Math.random() * 2; // 0-2 days base delay
  const priorityMultiplier = task.priority === 'high' ? 1.5 : task.priority === 'low' ? 0.7 : 1.0;
  const complexityMultiplier = task.estimatedHours ? Math.min(task.estimatedHours / 8, 3) : 1.0;
  
  const predictedDelay = baseDelay * priorityMultiplier * complexityMultiplier;
  const riskScore = Math.min(predictedDelay / 5, 1.0); // Normalize to 0-1
  const confidence = 0.7 + Math.random() * 0.2; // 70-90% confidence
  
  return {
    predictedDelay: Math.round(predictedDelay * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100
  };
}

// Helper function to generate work unit prediction
function generateWorkUnitPrediction(workUnit) {
  // Simple prediction algorithm for work units
  const baseDelay = Math.random() * 3; // 0-3 days base delay
  const typeMultiplier = {
    'design': 1.2,
    'simulation': 1.5,
    'validation': 1.0,
    'manufacturing': 1.3,
    'assembly': 0.8,
    'testing': 1.1,
    'documentation': 0.7
  }[workUnit.workUnitType] || 1.0;
  
  const predictedDelay = baseDelay * typeMultiplier;
  const riskScore = Math.min(predictedDelay / 7, 1.0); // Normalize to 0-1
  const confidence = 0.75 + Math.random() * 0.15; // 75-90% confidence
  
  return {
    predictedDelay: Math.round(predictedDelay * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100
  };
}

module.exports = router; 