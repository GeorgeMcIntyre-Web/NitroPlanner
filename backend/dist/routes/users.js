"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/me/digital-twin', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
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
        const digitalTwin = calculateBasicDigitalTwinMetrics(user);
        res.json({
            message: 'Digital twin profile retrieved successfully',
            digitalTwin
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/me/capacity-analysis', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/me/skill-recommendations', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { workUnitType, roleType } = req.query;
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            res.status(404).json({
                error: 'User not found'
            });
            return;
        }
        const recommendations = generateSkillRecommendations(user, workUnitType, roleType);
        res.json({
            message: 'Skill recommendations generated',
            recommendations
        });
    }
    catch (error) {
        next(error);
    }
});
function calculateBasicDigitalTwinMetrics(user) {
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
            availabilityScore: 85,
            performanceTrend: 'stable',
            overallCapacity: Math.max(0, 85 - (currentWorkload * 10))
        },
        workUnits: user.assignedWorkUnits,
        tasks: user.assignedTasks
    };
}
function analyzeUserCapacity(user) {
    const currentWorkload = user.assignedWorkUnits.length + user.assignedTasks.length;
    const maxCapacity = 5;
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
function generateSkillRecommendations(user, workUnitType, roleType) {
    const skillRequirements = {
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
    const currentSkills = [];
    const missingSkills = requiredSkills.filter((skill) => !currentSkills.some((userSkill) => userSkill.includes(skill)));
    const recommendations = missingSkills.map((skill) => ({
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
function calculateSkillMatch(role) {
    const roleSkillScores = {
        'MECHANICAL_DESIGNER': 85,
        'ELECTRICAL_DESIGNER': 80,
        'SIMULATION_ENGINEER': 90,
        'MANUFACTURING_ENGINEER': 75,
        'PROJECT_MANAGER': 70,
        'TECHNICIAN': 65
    };
    return roleSkillScores[role] || 70;
}
function getRecommendedWorkload(utilization) {
    if (utilization > 90)
        return 'reduce';
    if (utilization < 50)
        return 'increase';
    return 'maintain';
}
function getSuggestedTraining(skill) {
    const trainingMap = {
        'cad': 'SolidWorks Fundamentals Course',
        'finite element analysis': 'ANSYS Basic Training',
        'manufacturing processes': 'Manufacturing Process Optimization',
        'quality control': 'Six Sigma Green Belt Training'
    };
    return trainingMap[skill] || 'General skill development course';
}
exports.default = router;
//# sourceMappingURL=users.js.map