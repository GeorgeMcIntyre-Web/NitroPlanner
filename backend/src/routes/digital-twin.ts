import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// DIGITAL TWIN CORE ENDPOINTS
// ============================================================================

// Get complete digital twin profile
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const digitalTwin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        professionalProfile: true,
        skills: {
          orderBy: { level: 'desc' }
        },
        certifications: {
          where: { status: 'active' }
        },
        availability: true,
        workloadCapacity: true,
        performanceMetrics: true,
        learningPath: true,
        assignedWorkUnits: {
          where: {
            status: { in: ['pending', 'in_progress'] }
          },
          include: {
            project: {
              select: { name: true }
            }
          }
        },
        assignedTasks: {
          where: {
            status: { in: ['pending', 'in_progress'] }
          },
          include: {
            project: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!digitalTwin) {
      res.status(404).json({
        error: 'User not found',
        message: 'Digital twin profile not found'
      });
      return;
    }

    // Calculate comprehensive metrics
    const metrics = calculateDigitalTwinMetrics(digitalTwin);

    res.json({
      message: 'Digital twin profile retrieved successfully',
      digitalTwin: {
        user: {
          id: digitalTwin.id,
          firstName: digitalTwin.firstName,
          lastName: digitalTwin.lastName,
          role: digitalTwin.role,
          department: digitalTwin.department,
          email: digitalTwin.email
        },
        company: (digitalTwin as any).company,
        professionalProfile: (digitalTwin as any).professionalProfile,
        skills: (digitalTwin as any).skills,
        certifications: (digitalTwin as any).certifications,
        availability: (digitalTwin as any).availability,
        workloadCapacity: (digitalTwin as any).workloadCapacity,
        performanceMetrics: (digitalTwin as any).performanceMetrics,
        learningPath: (digitalTwin as any).learningPath,
        currentWork: {
          workUnits: (digitalTwin as any).assignedWorkUnits,
          tasks: (digitalTwin as any).assignedTasks
        },
        metrics
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PROFESSIONAL PROFILE MANAGEMENT
// ============================================================================

// Get professional profile
router.get('/me/professional-profile', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId }
    });

    res.json({
      message: 'Professional profile retrieved successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
});

// Create or update professional profile
router.put('/me/professional-profile', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profileData = req.body;

    const profile = await prisma.professionalProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        ...profileData,
        userId
      }
    });

    res.json({
      message: 'Professional profile updated successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SKILLS MANAGEMENT
// ============================================================================

// Get user skills
router.get('/me/skills', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const skills = await prisma.skill.findMany({
      where: { userId },
      orderBy: { level: 'desc' }
    });

    res.json({
      message: 'Skills retrieved successfully',
      skills
    });
  } catch (error) {
    next(error);
  }
});

// Add new skill
router.post('/me/skills', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const skillData = req.body;

    const skill = await prisma.skill.create({
      data: {
        ...skillData,
        userId
      }
    });

    res.status(201).json({
      message: 'Skill added successfully',
      skill
    });
  } catch (error) {
    next(error);
  }
});

// Update skill proficiency
router.put('/me/skills/:skillId', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { skillId } = req.params;
    const updateData = req.body;

    const skill = await prisma.skill.updateMany({
      where: {
        id: skillId,
        userId
      },
      data: updateData
    });

    res.json({
      message: 'Skill updated successfully',
      skill
    });
  } catch (error) {
    next(error);
  }
});

// Delete skill
router.delete('/me/skills/:skillId', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { skillId } = req.params;

    await prisma.skill.deleteMany({
      where: {
        id: skillId,
        userId
      }
    });

    res.json({
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// AVAILABILITY MANAGEMENT
// ============================================================================

// Get availability status
router.get('/me/availability', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const availability = await prisma.availability.findUnique({
      where: { userId }
    });

    res.json({
      message: 'Availability retrieved successfully',
      availability
    });
  } catch (error) {
    next(error);
  }
});

// Update availability status
router.put('/me/availability', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const availabilityData = req.body;

    const availability = await prisma.availability.upsert({
      where: { userId },
      update: {
        ...availabilityData,
        lastActive: new Date()
      },
      create: {
        ...availabilityData,
        userId,
        lastActive: new Date()
      }
    });

    res.json({
      message: 'Availability updated successfully',
      availability
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CAPACITY MANAGEMENT
// ============================================================================

// Get workload capacity
router.get('/me/capacity', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const capacity = await prisma.workloadCapacity.findUnique({
      where: { userId }
    });

    res.json({
      message: 'Capacity retrieved successfully',
      capacity
    });
  } catch (error) {
    next(error);
  }
});

// Update workload capacity
router.put('/me/capacity', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const capacityData = req.body;

    const capacity = await prisma.workloadCapacity.upsert({
      where: { userId },
      update: capacityData,
      create: {
        ...capacityData,
        userId
      }
    });

    res.json({
      message: 'Capacity updated successfully',
      capacity
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

// Get performance metrics
router.get('/me/performance', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const performance = await prisma.performanceMetrics.findUnique({
      where: { userId }
    });

    res.json({
      message: 'Performance metrics retrieved successfully',
      performance
    });
  } catch (error) {
    next(error);
  }
});

// Update performance metrics
router.put('/me/performance', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const performanceData = req.body;

    const performance = await prisma.performanceMetrics.upsert({
      where: { userId },
      update: {
        ...performanceData,
        lastCalculated: new Date()
      },
      create: {
        ...performanceData,
        userId,
        lastCalculated: new Date()
      }
    });

    res.json({
      message: 'Performance metrics updated successfully',
      performance
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEARNING PATH MANAGEMENT
// ============================================================================

// Get learning path
router.get('/me/learning-path', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const learningPath = await prisma.learningPath.findUnique({
      where: { userId }
    });

    res.json({
      message: 'Learning path retrieved successfully',
      learningPath
    });
  } catch (error) {
    next(error);
  }
});

// Update learning path
router.put('/me/learning-path', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const learningData = req.body;

    const learningPath = await prisma.learningPath.upsert({
      where: { userId },
      update: learningData,
      create: {
        ...learningData,
        userId
      }
    });

    res.json({
      message: 'Learning path updated successfully',
      learningPath
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ANALYTICS & RECOMMENDATIONS
// ============================================================================

// Get capacity analysis
router.get('/me/capacity-analysis', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedWorkUnits: {
          where: { status: { in: ['pending', 'in_progress'] } }
        },
        assignedTasks: {
          where: { status: { in: ['pending', 'in_progress'] } }
        },
        workloadCapacity: true,
        availability: true,
        skills: true
      }
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    const analysis = analyzeUserCapacity(user);

    res.json({
      message: 'Capacity analysis completed',
      analysis
    });
  } catch (error) {
    next(error);
  }
});

// Get skill recommendations
router.get('/me/skill-recommendations', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        assignedWorkUnits: {
          include: {
            project: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    const recommendations = generateSkillRecommendations(user);

    res.json({
      message: 'Skill recommendations generated',
      recommendations
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TEAM CAPACITY OVERVIEW (Practical for Project Managers)
// ============================================================================

// Get team capacity overview for project managers
router.get('/team/capacity-overview', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    // Get all active users in the company
    const teamMembers = await prisma.user.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: {
        assignedWorkUnits: {
          where: {
            status: { in: ['pending', 'in_progress'] }
          }
        },
        assignedTasks: {
          where: {
            status: { in: ['pending', 'in_progress'] }
          }
        }
      }
    });

    // Calculate capacity metrics for each team member
    const teamCapacity = teamMembers.map(member => {
      const currentWorkload = (member as any).assignedWorkUnits.length + (member as any).assignedTasks.length;
      const maxCapacity = 5; // Default max concurrent tasks
      const utilization = (currentWorkload / maxCapacity) * 100;
      
      let capacityStatus = 'available';
      if (utilization >= 90) capacityStatus = 'overloaded';
      else if (utilization >= 75) capacityStatus = 'busy';
      else if (utilization >= 50) capacityStatus = 'moderate';
      else capacityStatus = 'available';

      return {
        user: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role,
          department: member.department
        },
        capacity: {
          currentWorkload,
          maxCapacity,
          utilization: Math.round(utilization),
          status: capacityStatus,
          availableCapacity: Math.max(0, maxCapacity - currentWorkload)
        },
        currentWork: {
          workUnits: (member as any).assignedWorkUnits.map((wu: any) => ({
            id: wu.id,
            name: wu.name,
            status: wu.status,
            priority: wu.priority
          })),
          tasks: (member as any).assignedTasks.map((task: any) => ({
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority
          }))
        }
      };
    });

    // Calculate team-wide metrics
    const totalMembers = teamMembers.length;
    const availableMembers = teamCapacity.filter(member => member.capacity.status === 'available').length;
    const busyMembers = teamCapacity.filter(member => member.capacity.status === 'busy').length;
    const overloadedMembers = teamCapacity.filter(member => member.capacity.status === 'overloaded').length;

    const totalCapacity = teamCapacity.reduce((sum, member) => sum + member.capacity.maxCapacity, 0);
    const totalUtilization = teamCapacity.reduce((sum, member) => sum + member.capacity.currentWorkload, 0);
    const overallUtilization = totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0;

    res.json({
      message: 'Team capacity overview retrieved successfully',
      teamMetrics: {
        totalMembers,
        availableMembers,
        busyMembers,
        overloadedMembers,
        overallUtilization: Math.round(overallUtilization),
        totalCapacity,
        totalUtilization
      },
      teamCapacity: teamCapacity.sort((a, b) => b.capacity.utilization - a.capacity.utilization),
      recommendations: generateTeamRecommendations(teamCapacity)
    });
  } catch (error) {
    next(error);
  }
});

// Get capacity alerts for project managers
router.get('/team/capacity-alerts', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    // Get overloaded team members
    const overloadedMembers = await prisma.user.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: {
        assignedWorkUnits: {
          where: {
            status: { in: ['pending', 'in_progress'] }
          }
        },
        assignedTasks: {
          where: {
            status: { in: ['pending', 'in_progress'] }
          }
        }
      }
    });

    const alerts = [];

    overloadedMembers.forEach(member => {
      const currentWorkload = (member as any).assignedWorkUnits.length + (member as any).assignedTasks.length;
      const maxCapacity = 5;
      const utilization = (currentWorkload / maxCapacity) * 100;

      if (utilization >= 90) {
        alerts.push({
          type: 'overload',
          severity: 'high',
          user: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            role: member.role
          },
          message: `${member.firstName} ${member.lastName} is at ${Math.round(utilization)}% capacity`,
          recommendation: 'Consider redistributing work or delaying new assignments',
          currentWorkload,
          maxCapacity
        });
      } else if (utilization >= 75) {
        alerts.push({
          type: 'high_utilization',
          severity: 'medium',
          user: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            role: member.role
          },
          message: `${member.firstName} ${member.lastName} is at ${Math.round(utilization)}% capacity`,
          recommendation: 'Monitor workload and plan assignments carefully',
          currentWorkload,
          maxCapacity
        });
      }
    });

    res.json({
      message: 'Capacity alerts retrieved successfully',
      alerts: alerts.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
      }),
      totalAlerts: alerts.length
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDigitalTwinMetrics(user: any) {
  const currentWorkload = user.assignedWorkUnits.length + user.assignedTasks.length;
  const maxCapacity = user.workloadCapacity?.maxConcurrentTasks || 5;
  const capacityUtilization = (currentWorkload / maxCapacity) * 100;
  
  // Calculate skill match score
  const skillMatch = calculateSkillMatch(user);
  
  // Calculate availability score
  const availabilityScore = calculateAvailabilityScore(user);
  
  // Calculate performance trend
  const performanceTrend = calculatePerformanceTrend(user);
  
  // Calculate overall capacity
  const overallCapacity = Math.max(0, 100 - capacityUtilization);

  return {
    currentWorkload,
    capacityUtilization: Math.round(capacityUtilization),
    skillMatch: Math.round(skillMatch),
    availabilityScore: Math.round(availabilityScore),
    performanceTrend,
    overallCapacity: Math.round(overallCapacity),
    maxCapacity,
    stressLevel: user.workloadCapacity?.stressLevel || 'unknown',
    energyLevel: user.workloadCapacity?.energyLevel || 'unknown',
    focusLevel: user.workloadCapacity?.focusLevel || 'unknown'
  };
}

function calculateSkillMatch(user: any): number {
  // This is a simplified calculation - in a real implementation,
  // you would compare user skills with current work requirements
  const userSkills = user.skills || [];
  const skillLevels = userSkills.map((skill: any) => skill.level);
  const averageSkillLevel = skillLevels.length > 0 
    ? skillLevels.reduce((a: number, b: number) => a + b, 0) / skillLevels.length 
    : 0;
  
  return Math.min(100, (averageSkillLevel / 10) * 100);
}

function calculateAvailabilityScore(user: any): number {
  if (!user.availability) return 50;
  
  const status = user.availability.currentStatus;
  const statusScores: { [key: string]: number } = {
    'available': 100,
    'busy': 60,
    'away': 30,
    'offline': 0
  };
  
  return statusScores[status] || 50;
}

function calculatePerformanceTrend(user: any): string {
  if (!user.performanceMetrics) return 'stable';
  
  const metrics = user.performanceMetrics;
  const scores = [
    metrics.taskCompletionRate,
    metrics.qualityScore,
    metrics.efficiencyScore,
    metrics.collaborationScore
  ].filter(score => score > 0);
  
  if (scores.length === 0) return 'stable';
  
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  if (averageScore >= 8) return 'excellent';
  if (averageScore >= 6) return 'good';
  if (averageScore >= 4) return 'stable';
  return 'needs_improvement';
}

function analyzeUserCapacity(user: any) {
  const currentWorkload = user.assignedWorkUnits.length + user.assignedTasks.length;
  const maxCapacity = user.workloadCapacity?.maxConcurrentTasks || 5;
  const utilization = (currentWorkload / maxCapacity) * 100;
  
  const capacityFactors = {
    currentWorkload,
    maxCapacity,
    utilization: Math.round(utilization),
    availabilityStatus: user.availability?.currentStatus || 'unknown',
    stressLevel: user.workloadCapacity?.stressLevel || 'unknown',
    energyLevel: user.workloadCapacity?.energyLevel || 'unknown',
    focusLevel: user.workloadCapacity?.focusLevel || 'unknown'
  };

  // Generate recommendations based on capacity
  const recommendations = [];
  
  if (utilization > 90) {
    recommendations.push({
      type: 'warning',
      message: 'You are at maximum capacity. Consider declining new assignments.',
      priority: 'high'
    });
  } else if (utilization > 75) {
    recommendations.push({
      type: 'info',
      message: 'You are approaching capacity. Plan your workload carefully.',
      priority: 'medium'
    });
  } else if (utilization < 30) {
    recommendations.push({
      type: 'opportunity',
      message: 'You have capacity for additional work. Consider taking on new challenges.',
      priority: 'low'
    });
  }

  return {
    capacityFactors,
    recommendations,
    riskLevel: utilization > 90 ? 'high' : utilization > 75 ? 'medium' : 'low'
  };
}

function generateSkillRecommendations(user: any) {
  const userSkills = user.skills || [];
  const currentSkills = userSkills.map((skill: any) => skill.name.toLowerCase());
  
  // Define skill requirements for different work types
  const skillRequirements: { [key: string]: string[] } = {
    'mechanical_designer': ['cad', 'solidworks', 'autocad', 'mechanical design', '3d modeling'],
    'electrical_designer': ['electrical design', 'circuit design', 'pcb design', 'autocad electrical'],
    'simulation_engineer': ['ansys', 'simulation', 'finite element analysis', 'cfd', 'thermal analysis'],
    'manufacturing_engineer': ['manufacturing', 'cnc', 'production planning', 'quality control'],
    'quality_engineer': ['quality assurance', 'testing', 'inspection', 'iso standards']
  };

  const roleRequirements = skillRequirements[user.role.toLowerCase()] || [];
  const missingSkills = roleRequirements.filter(skill => 
    !currentSkills.some((userSkill: string) => userSkill.includes(skill))
  );

  return {
    currentSkills,
    requiredSkills: roleRequirements,
    missingSkills,
    recommendations: missingSkills.map(skill => ({
      skill,
      priority: 'high',
      reason: `Required for ${user.role} role`,
      suggestedTraining: `Consider training in ${skill}`
    })),
    skillMatchPercentage: roleRequirements.length > 0 
      ? Math.round(((currentSkills.length - missingSkills.length) / roleRequirements.length) * 100)
      : 0
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR TEAM CAPACITY
// ============================================================================

function generateTeamRecommendations(teamCapacity: any[]) {
  const recommendations = [];

  const overloadedCount = teamCapacity.filter(member => member.capacity.status === 'overloaded').length;
  const availableCount = teamCapacity.filter(member => member.capacity.status === 'available').length;

  if (overloadedCount > 0) {
    recommendations.push({
      type: 'workload_redistribution',
      priority: 'high',
      message: `${overloadedCount} team member(s) are overloaded`,
      action: 'Consider redistributing work to available team members'
    });
  }

  if (availableCount > 2) {
    recommendations.push({
      type: 'capacity_optimization',
      priority: 'medium',
      message: `${availableCount} team member(s) have available capacity`,
      action: 'Consider assigning new work units or tasks to optimize team utilization'
    });
  }

  const avgUtilization = teamCapacity.reduce((sum, member) => sum + member.capacity.utilization, 0) / teamCapacity.length;
  
  if (avgUtilization < 50) {
    recommendations.push({
      type: 'underutilization',
      priority: 'medium',
      message: `Team utilization is ${Math.round(avgUtilization)}%`,
      action: 'Consider increasing workload or reallocating resources'
    });
  }

  return recommendations;
}

export default router; 