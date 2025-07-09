import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    companyId: string;
  };
}

// Get current user's digital twin profile (simplified version)
router.get('/me/digital-twin', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
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

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
      return;
    }

    // Calculate basic digital twin metrics
    const digitalTwin = calculateBasicDigitalTwinMetrics(user);

    res.json({
      message: 'Digital twin profile retrieved successfully',
      digitalTwin
    });
  } catch (error) {
    next(error);
  }
});

// Get user's capacity analysis
router.get('/me/capacity-analysis', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
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

    if (!user) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    const capacityAnalysis = analyzeUserCapacity(user);

    res.json({
      message: 'Capacity analysis completed',
      capacityAnalysis
    });
  } catch (error) {
    next(error);
  }
});

// Get skill-based recommendations for work units
router.get('/me/skill-recommendations', authenticateToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workUnitType, roleType } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id }
    });

    if (!user) {
      res.status(404).json({
        error: 'User not found'
      });
      return;
    }

    const recommendations = generateSkillRecommendations(user, workUnitType as string, roleType as string);

    res.json({
      message: 'Skill recommendations generated',
      recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate basic digital twin metrics
function calculateBasicDigitalTwinMetrics(user: any) {
  const currentWorkload = user.assignedWorkUnits.length + user.assignedTasks.length;
  
  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department
    },
    company: user.company,
    metrics: {
      currentWorkload,
      skillMatch: calculateSkillMatch(user.role),
      availabilityScore: 85, // Placeholder
      performanceTrend: 'stable', // Placeholder
      overallCapacity: Math.max(0, 85 - (currentWorkload * 10))
    },
    workUnits: user.assignedWorkUnits,
    tasks: user.assignedTasks
  };
}

// Helper function to analyze user capacity
function analyzeUserCapacity(user: any) {
  const currentWorkload = user.assignedWorkUnits.length + user.assignedTasks.length;
  const maxCapacity = 5; // Default max concurrent tasks
  const utilization = (currentWorkload / maxCapacity) * 100;

  return {
    currentWorkload,
    maxCapacity,
    utilization,
    capacityFactors: {
      stressLevel: 'medium',
      energyLevel: 'medium',
      focusLevel: 'medium'
    },
    availabilityStatus: 'available',
    isAvailable: true,
    canTakeMoreWork: utilization < 80,
    recommendedWorkload: getRecommendedWorkload(utilization)
  };
}

// Helper function to generate skill recommendations
function generateSkillRecommendations(user: any, workUnitType: string, roleType: string) {
  // Define required skills for different work unit types and roles
  const skillRequirements: { [key: string]: { [key: string]: string[] } } = {
    design: {
      mechanical_designer: ['cad', 'solidworks', 'autocad', 'mechanical design', '3d modeling'],
      electrical_designer: ['electrical design', 'circuit design', 'pcb design', 'autocad electrical'],
      simulation_engineer: ['finite element analysis', 'ansys', 'simulation', 'analysis']
    },
    simulation: {
      simulation_engineer: ['finite element analysis', 'ansys', 'comsol', 'matlab', 'python'],
      mechanical_designer: ['solidworks simulation', 'stress analysis', 'thermal analysis']
    },
    manufacturing: {
      manufacturing_engineer: ['manufacturing processes', 'cnc', 'quality control', 'lean manufacturing'],
      technician: ['assembly', 'testing', 'quality assurance']
    }
  };

  const requiredSkills = skillRequirements[workUnitType]?.[roleType] || [];
  const currentSkills: string[] = []; // Placeholder - would come from user skills

  const missingSkills = requiredSkills.filter((skill: string) => 
    !currentSkills.some((userSkill: string) => userSkill.includes(skill))
  );

  const recommendations = missingSkills.map((skill: string) => ({
    skill,
    priority: 'high',
    reason: `Required for ${workUnitType} work as ${roleType}`,
    suggestedTraining: getSuggestedTraining(skill)
  }));

  return {
    currentSkills,
    requiredSkills,
    missingSkills,
    recommendations,
    skillMatchPercentage: requiredSkills.length > 0 ? ((currentSkills.length - missingSkills.length) / requiredSkills.length) * 100 : 0
  };
}

// Helper functions
function calculateSkillMatch(role: string) {
  // Basic skill matching based on role
  const roleSkillScores: { [key: string]: number } = {
    'MECHANICAL_DESIGNER': 85,
    'ELECTRICAL_DESIGNER': 80,
    'SIMULATION_ENGINEER': 90,
    'MANUFACTURING_ENGINEER': 75,
    'PROJECT_MANAGER': 70,
    'TECHNICIAN': 65
  };
  
  return roleSkillScores[role] || 70;
}

function getRecommendedWorkload(utilization: number) {
  if (utilization > 90) return 'reduce';
  if (utilization < 50) return 'increase';
  return 'maintain';
}

function getSuggestedTraining(skill: string) {
  const trainingMap: { [key: string]: string } = {
    'cad': 'SolidWorks Fundamentals Course',
    'finite element analysis': 'ANSYS Basic Training',
    'manufacturing processes': 'Manufacturing Process Optimization',
    'quality control': 'Six Sigma Green Belt Training'
  };
  
  return trainingMap[skill] || 'General skill development course';
}

export default router; 