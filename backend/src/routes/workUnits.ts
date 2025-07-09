import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all work units
router.get('/', async (req: Request, res: Response) => {
  try {
    const workUnits = await prisma.workUnit.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        checkpoints: true
      }
    });
    res.json(workUnits);
  } catch (error) {
    console.error('Error fetching work units:', error);
    res.status(500).json({ error: 'Failed to fetch work units' });
  }
});

// Get work unit by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workUnitId = req.params.id;
    if (!workUnitId) {
      res.status(400).json({ error: 'Work unit ID is required' });
      return;
    }
    
    const workUnit = await prisma.workUnit.findUnique({
      where: { id: workUnitId },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        checkpoints: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    if (!workUnit) {
      res.status(404).json({ error: 'Work unit not found' });
      return;
    }

    res.json(workUnit);
    return;
  } catch (error) {
    console.error('Error fetching work unit:', error);
    res.status(500).json({ error: 'Failed to fetch work unit' });
    return;
  }
});

// Create new work unit
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, projectId, workUnitType, roleType, estimatedHours, assignedToId, startDate } = req.body;

    const workUnit = await prisma.workUnit.create({
      data: {
        name: name as string,
        description: description as string,
        projectId: projectId as string,
        workUnitType: workUnitType as string,
        roleType: roleType as string,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        assignedToId: assignedToId || null,
        startDate: startDate ? new Date(startDate) : null,
        createdById: (req as any).user?.id || 'system' // Add createdById
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        checkpoints: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.status(201).json(workUnit);
    return;
  } catch (error) {
    console.error('Error creating work unit:', error);
    res.status(500).json({ error: 'Failed to create work unit' });
    return;
  }
});

// Update work unit
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const workUnitId = req.params.id;
    if (!workUnitId) {
      res.status(400).json({ error: 'Work unit ID is required' });
      return;
    }
    
    const { name, description, workUnitType, estimatedHours, actualHours, status, assignedToId, startDate, endDate } = req.body;

    const workUnit = await prisma.workUnit.update({
      where: { id: workUnitId },
      data: {
        name: name as string,
        description: description as string,
        workUnitType: workUnitType as string,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        actualHours: actualHours ? parseFloat(actualHours) : null,
        status: status as string,
        assignedToId: assignedToId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        checkpoints: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.json(workUnit);
    return;
  } catch (error) {
    console.error('Error updating work unit:', error);
    res.status(500).json({ error: 'Failed to update work unit' });
    return;
  }
});

// Delete work unit
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const workUnitId = req.params.id;
    if (!workUnitId) {
      res.status(400).json({ error: 'Work unit ID is required' });
      return;
    }
    
    await prisma.workUnit.delete({
      where: { id: workUnitId }
    });

    res.json({ message: 'Work unit deleted successfully' });
    return;
  } catch (error) {
    console.error('Error deleting work unit:', error);
    res.status(500).json({ error: 'Failed to delete work unit' });
    return;
  }
});

// ============================================================================
// SMART WORK UNIT ASSIGNMENT WITH DIGITAL TWIN INTEGRATION
// ============================================================================

// Get intelligent assignment recommendations for a work unit
router.get('/:workUnitId/smart-assignment', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workUnitId } = req.params;
    if (!workUnitId) {
      res.status(400).json({ error: 'workUnitId is required' });
      return;
    }
    const companyId = (req as any).user.companyId;

    // Get the work unit details
    const workUnit = await prisma.workUnit.findUnique({
      where: { id: workUnitId },
      include: {
        project: { select: { name: true } }
      }
    });

    if (!workUnit) {
      res.status(404).json({
        error: 'Work unit not found',
        message: 'The specified work unit does not exist'
      });
      return;
    }

    // Get all available users in the company (simplified query)
    const availableUsers = await prisma.user.findMany({
      where: {
        companyId,
        isActive: true
      }
    });

    // For now, return basic recommendations without complex scoring
    const recommendations = availableUsers.slice(0, 5).map((user: any) => ({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      },
      score: Math.floor(Math.random() * 40) + 60, // Placeholder score
      breakdown: {
        skillMatch: Math.floor(Math.random() * 30) + 70,
        capacityScore: Math.floor(Math.random() * 30) + 70,
        performanceScore: Math.floor(Math.random() * 30) + 70,
        availabilityScore: Math.floor(Math.random() * 30) + 70,
        experienceScore: Math.floor(Math.random() * 30) + 70
      },
      currentWorkload: Math.floor(Math.random() * 3) + 1,
      riskFactors: [],
      estimatedCompletion: '3-5 days'
    }));

    res.json({
      message: 'Smart assignment recommendations generated',
      workUnit: {
        id: workUnit.id,
        name: workUnit.name,
        workUnitType: workUnit.workUnitType,
        roleType: workUnit.roleType,
        project: workUnit.project.name
      },
      recommendations: recommendations.sort((a, b) => b.score - a.score),
      totalCandidates: availableUsers.length,
      viableCandidates: recommendations.length
    });
  } catch (error) {
    next(error);
  }
});

// Assign work unit with smart recommendation (simplified)
router.post('/:workUnitId/smart-assign', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workUnitId } = req.params;
    if (!workUnitId) {
      res.status(400).json({ error: 'workUnitId is required' });
      return;
    }
    const { userId, reason } = req.body;

    // Validate the assignment
    const workUnit = await prisma.workUnit.findUnique({
      where: { id: workUnitId }
    });

    if (!workUnit) {
      res.status(404).json({
        error: 'Work unit not found'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    // Assign the work unit
    const updatedWorkUnit = await prisma.workUnit.update({
      where: { id: workUnitId },
      data: {
        assignedToId: userId,
        status: 'pending'
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        project: {
          select: { name: true }
        }
      }
    });

    res.json({
      message: 'Work unit assigned successfully',
      workUnit: updatedWorkUnit,
      assignment: {
        assignedTo: updatedWorkUnit.assignedTo,
        project: updatedWorkUnit.project.name,
        reason: reason || 'Smart assignment'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// HELPER FUNCTIONS FOR SMART ASSIGNMENT
// ============================================================================

function calculateAssignmentScore(workUnit: any, user: any) {
  // Skill matching (40% weight)
  const skillMatch = calculateSkillMatchScore(workUnit, user);
  
  // Capacity score (25% weight)
  const capacityScore = calculateCapacityScore(user);
  
  // Performance score (20% weight)
  const performanceScore = calculatePerformanceScore(user);
  
  // Availability score (10% weight)
  const availabilityScore = calculateAvailabilityScore(user);
  
  // Experience score (5% weight)
  const experienceScore = calculateExperienceScore(workUnit, user);

  // Calculate weighted total score
  const totalScore = (
    skillMatch * 0.4 +
    capacityScore * 0.25 +
    performanceScore * 0.2 +
    availabilityScore * 0.1 +
    experienceScore * 0.05
  );

  // Identify risk factors
  const riskFactors = [];
  if (capacityScore < 50) riskFactors.push('High workload');
  if (skillMatch < 60) riskFactors.push('Skill gap');
  if (availabilityScore < 70) riskFactors.push('Limited availability');
  if (performanceScore < 60) riskFactors.push('Performance concerns');

  // Estimate completion time based on skills and capacity
  const estimatedCompletion = estimateCompletionTime(workUnit, user, skillMatch, capacityScore);

  return {
    totalScore: Math.round(totalScore),
    skillMatch: Math.round(skillMatch),
    capacityScore: Math.round(capacityScore),
    performanceScore: Math.round(performanceScore),
    availabilityScore: Math.round(availabilityScore),
    experienceScore: Math.round(experienceScore),
    riskFactors,
    estimatedCompletion
  };
}

function calculateSkillMatchScore(workUnit: any, user: any): number {
  const userSkills = user.skills || [];
  const workUnitType = workUnit.workUnitType.toLowerCase();
  const roleType = workUnit.roleType.toLowerCase();

  // Define skill requirements for different work unit types
  const skillRequirements: { [key: string]: string[] } = {
    'design': ['cad', 'solidworks', 'autocad', '3d modeling', 'mechanical design'],
    'simulation': ['ansys', 'simulation', 'finite element analysis', 'cfd', 'thermal analysis'],
    'manufacturing': ['manufacturing', 'cnc', 'production planning', 'quality control'],
    'assembly': ['assembly', 'mechanical', 'electrical', 'testing'],
    'testing': ['testing', 'quality assurance', 'validation', 'inspection'],
    'documentation': ['documentation', 'technical writing', 'standards', 'compliance']
  };

  const requiredSkills = skillRequirements[workUnitType] || [];
  const userSkillNames = userSkills.map((skill: any) => skill.name.toLowerCase());
  
  let matchScore = 0;
  let totalWeight = 0;

  requiredSkills.forEach((requiredSkill: string) => {
    const matchingSkills = userSkillNames.filter((userSkill: string) => 
      userSkill.includes(requiredSkill) || requiredSkill.includes(userSkill)
    );
    
    if (matchingSkills.length > 0) {
      const bestMatch = userSkills.find((skill: any) => 
        skill.name.toLowerCase().includes(requiredSkill) || requiredSkill.includes(skill.name.toLowerCase())
      );
      matchScore += (bestMatch?.level || 5) * 10; // Level 1-10 becomes 10-100
      totalWeight += 100;
    }
  });

  // Bonus for role alignment
  if (user.role.toLowerCase().includes(roleType) || roleType.includes(user.role.toLowerCase())) {
    matchScore += 20;
    totalWeight += 20;
  }

  return totalWeight > 0 ? Math.min(100, (matchScore / totalWeight) * 100) : 0;
}

function calculateCapacityScore(user: any): number {
  const currentWorkload = (user as any).assignedWorkUnits.length + (user as any).assignedTasks.length;
  const maxCapacity = (user as any).workloadCapacity?.maxConcurrentTasks || 5;
  const utilization = (currentWorkload / maxCapacity) * 100;

  // Higher score for lower utilization (more capacity available)
  if (utilization <= 50) return 100;
  if (utilization <= 70) return 80;
  if (utilization <= 85) return 60;
  if (utilization <= 95) return 30;
  return 10;
}

function calculatePerformanceScore(user: any): number {
  const metrics = (user as any).performanceMetrics;
  if (!metrics) return 70; // Default score if no metrics available

  const scores = [
    metrics.taskCompletionRate || 0,
    metrics.qualityScore || 0,
    metrics.efficiencyScore || 0,
    metrics.collaborationScore || 0
  ].filter((score: number) => score > 0);

  if (scores.length === 0) return 70;

  const averageScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
  return Math.min(100, averageScore * 10); // Convert 0-10 scale to 0-100
}

function calculateAvailabilityScore(user: any): number {
  const availability = (user as any).availability;
  if (!availability) return 70;

  const status = availability.currentStatus;
  const statusScores: { [key: string]: number } = {
    'available': 100,
    'busy': 60,
    'away': 30,
    'offline': 0
  };

  return statusScores[status] || 70;
}

function calculateExperienceScore(workUnit: any, user: any): number {
  const profile = (user as any).professionalProfile;
  if (!profile) return 50;

  const yearsOfExperience = profile.yearsOfExperience || 0;
  const workUnitType = workUnit.workUnitType.toLowerCase();

  // Higher score for more experience in relevant areas
  if (yearsOfExperience >= 5) return 100;
  if (yearsOfExperience >= 3) return 80;
  if (yearsOfExperience >= 1) return 60;
  return 40;
}

function estimateCompletionTime(workUnit: any, user: any, skillMatch: number, capacityScore: number): string {
  const estimatedHours = workUnit.estimatedHours || 40;
  
  // Adjust based on skill match and capacity
  let adjustedHours = estimatedHours;
  
  if (skillMatch < 60) adjustedHours *= 1.5; // 50% longer if skills don't match well
  if (capacityScore < 50) adjustedHours *= 1.3; // 30% longer if capacity is limited
  
  const days = Math.ceil(adjustedHours / 8); // Assuming 8-hour workdays
  
  if (days <= 1) return 'Same day';
  if (days <= 3) return `${days} days`;
  if (days <= 7) return `${Math.ceil(days / 5)} weeks`;
  return `${Math.ceil(days / 20)} months`;
}

export default router; 