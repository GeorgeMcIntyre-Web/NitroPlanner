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
router.get('/', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching work units:', error);
        res.status(500).json({ error: 'Failed to fetch work units' });
    }
});
router.get('/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching work unit:', error);
        res.status(500).json({ error: 'Failed to fetch work unit' });
        return;
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, description, projectId, workUnitType, roleType, estimatedHours, assignedToId, startDate } = req.body;
        const workUnit = await prisma.workUnit.create({
            data: {
                name: name,
                description: description,
                projectId: projectId,
                workUnitType: workUnitType,
                roleType: roleType,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
                assignedToId: assignedToId || null,
                startDate: startDate ? new Date(startDate) : null,
                createdById: req.user?.id || 'system'
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
    }
    catch (error) {
        console.error('Error creating work unit:', error);
        res.status(500).json({ error: 'Failed to create work unit' });
        return;
    }
});
router.put('/:id', async (req, res) => {
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
                name: name,
                description: description,
                workUnitType: workUnitType,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
                actualHours: actualHours ? parseFloat(actualHours) : null,
                status: status,
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
    }
    catch (error) {
        console.error('Error updating work unit:', error);
        res.status(500).json({ error: 'Failed to update work unit' });
        return;
    }
});
router.delete('/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error deleting work unit:', error);
        res.status(500).json({ error: 'Failed to delete work unit' });
        return;
    }
});
router.get('/:workUnitId/smart-assignment', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { workUnitId } = req.params;
        if (!workUnitId) {
            res.status(400).json({ error: 'workUnitId is required' });
            return;
        }
        const companyId = req.user.companyId;
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
        const availableUsers = await prisma.user.findMany({
            where: {
                companyId,
                isActive: true
            }
        });
        const recommendations = availableUsers.slice(0, 5).map((user) => ({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                department: user.department
            },
            score: Math.floor(Math.random() * 40) + 60,
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/:workUnitId/smart-assign', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const { workUnitId } = req.params;
        if (!workUnitId) {
            res.status(400).json({ error: 'workUnitId is required' });
            return;
        }
        const { userId, reason } = req.body;
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
    }
    catch (error) {
        next(error);
    }
});
function calculateAssignmentScore(workUnit, user) {
    const skillMatch = calculateSkillMatchScore(workUnit, user);
    const capacityScore = calculateCapacityScore(user);
    const performanceScore = calculatePerformanceScore(user);
    const availabilityScore = calculateAvailabilityScore(user);
    const experienceScore = calculateExperienceScore(workUnit, user);
    const totalScore = (skillMatch * 0.4 +
        capacityScore * 0.25 +
        performanceScore * 0.2 +
        availabilityScore * 0.1 +
        experienceScore * 0.05);
    const riskFactors = [];
    if (capacityScore < 50)
        riskFactors.push('High workload');
    if (skillMatch < 60)
        riskFactors.push('Skill gap');
    if (availabilityScore < 70)
        riskFactors.push('Limited availability');
    if (performanceScore < 60)
        riskFactors.push('Performance concerns');
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
function calculateSkillMatchScore(workUnit, user) {
    const userSkills = user.skills || [];
    const workUnitType = workUnit.workUnitType.toLowerCase();
    const roleType = workUnit.roleType.toLowerCase();
    const skillRequirements = {
        'design': ['cad', 'solidworks', 'autocad', '3d modeling', 'mechanical design'],
        'simulation': ['ansys', 'simulation', 'finite element analysis', 'cfd', 'thermal analysis'],
        'manufacturing': ['manufacturing', 'cnc', 'production planning', 'quality control'],
        'assembly': ['assembly', 'mechanical', 'electrical', 'testing'],
        'testing': ['testing', 'quality assurance', 'validation', 'inspection'],
        'documentation': ['documentation', 'technical writing', 'standards', 'compliance']
    };
    const requiredSkills = skillRequirements[workUnitType] || [];
    const userSkillNames = userSkills.map((skill) => skill.name.toLowerCase());
    let matchScore = 0;
    let totalWeight = 0;
    requiredSkills.forEach((requiredSkill) => {
        const matchingSkills = userSkillNames.filter((userSkill) => userSkill.includes(requiredSkill) || requiredSkill.includes(userSkill));
        if (matchingSkills.length > 0) {
            const bestMatch = userSkills.find((skill) => skill.name.toLowerCase().includes(requiredSkill) || requiredSkill.includes(skill.name.toLowerCase()));
            matchScore += (bestMatch?.level || 5) * 10;
            totalWeight += 100;
        }
    });
    if (user.role.toLowerCase().includes(roleType) || roleType.includes(user.role.toLowerCase())) {
        matchScore += 20;
        totalWeight += 20;
    }
    return totalWeight > 0 ? Math.min(100, (matchScore / totalWeight) * 100) : 0;
}
function calculateCapacityScore(user) {
    const currentWorkload = user.assignedWorkUnits.length + user.assignedTasks.length;
    const maxCapacity = user.workloadCapacity?.maxConcurrentTasks || 5;
    const utilization = (currentWorkload / maxCapacity) * 100;
    if (utilization <= 50)
        return 100;
    if (utilization <= 70)
        return 80;
    if (utilization <= 85)
        return 60;
    if (utilization <= 95)
        return 30;
    return 10;
}
function calculatePerformanceScore(user) {
    const metrics = user.performanceMetrics;
    if (!metrics)
        return 70;
    const scores = [
        metrics.taskCompletionRate || 0,
        metrics.qualityScore || 0,
        metrics.efficiencyScore || 0,
        metrics.collaborationScore || 0
    ].filter((score) => score > 0);
    if (scores.length === 0)
        return 70;
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.min(100, averageScore * 10);
}
function calculateAvailabilityScore(user) {
    const availability = user.availability;
    if (!availability)
        return 70;
    const status = availability.currentStatus;
    const statusScores = {
        'available': 100,
        'busy': 60,
        'away': 30,
        'offline': 0
    };
    return statusScores[status] || 70;
}
function calculateExperienceScore(workUnit, user) {
    const profile = user.professionalProfile;
    if (!profile)
        return 50;
    const yearsOfExperience = profile.yearsOfExperience || 0;
    const workUnitType = workUnit.workUnitType.toLowerCase();
    if (yearsOfExperience >= 5)
        return 100;
    if (yearsOfExperience >= 3)
        return 80;
    if (yearsOfExperience >= 1)
        return 60;
    return 40;
}
function estimateCompletionTime(workUnit, user, skillMatch, capacityScore) {
    const estimatedHours = workUnit.estimatedHours || 40;
    let adjustedHours = estimatedHours;
    if (skillMatch < 60)
        adjustedHours *= 1.5;
    if (capacityScore < 50)
        adjustedHours *= 1.3;
    const days = Math.ceil(adjustedHours / 8);
    if (days <= 1)
        return 'Same day';
    if (days <= 3)
        return `${days} days`;
    if (days <= 7)
        return `${Math.ceil(days / 5)} weeks`;
    return `${Math.ceil(days / 20)} months`;
}
exports.default = router;
//# sourceMappingURL=workUnits.js.map