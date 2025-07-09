"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        const projects = await prisma.project.findMany({
            where: { companyId: user.companyId },
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                priority: true,
                startDate: true,
                endDate: true,
                budget: true,
                progress: true,
                predictedCompletion: true,
                riskLevel: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.json(projects);
    }
    catch (error) {
        return next(error);
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        if (!id) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        const project = await prisma.project.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        return res.json(project);
    }
    catch (error) {
        return next(error);
    }
});
router.post('/', auth_1.authenticateToken, [
    (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 1000 }),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'medium', 'high']),
    (0, express_validator_1.body)('startDate').optional().isISO8601(),
    (0, express_validator_1.body)('endDate').optional().isISO8601(),
    (0, express_validator_1.body)('budget').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('progress').optional().isFloat({ min: 0, max: 100 })
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }
        const user = req.user;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        const { name, description, status, priority, startDate, endDate, budget, progress } = req.body;
        const project = await prisma.project.create({
            data: {
                name,
                description,
                status: status || 'active',
                priority: priority || 'medium',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                budget: budget ? Number(budget) : null,
                progress: progress ? Number(progress) : 0,
                companyId: user.companyId,
                createdById: user.id,
            },
        });
        return res.status(201).json(project);
    }
    catch (error) {
        return next(error);
    }
});
router.put('/:id', auth_1.authenticateToken, [
    (0, express_validator_1.body)('name').optional().isString().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 1000 }),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'medium', 'high']),
    (0, express_validator_1.body)('startDate').optional().isISO8601(),
    (0, express_validator_1.body)('endDate').optional().isISO8601(),
    (0, express_validator_1.body)('budget').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('progress').optional().isFloat({ min: 0, max: 100 })
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }
        const user = req.user;
        const { id } = req.params;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        if (!id) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        const { name, description, status, priority, startDate, endDate, budget, progress } = req.body;
        const project = await prisma.project.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const updated = await prisma.project.update({
            where: { id },
            data: {
                name: name ?? project.name,
                description: description ?? project.description,
                status: status ?? project.status,
                priority: priority ?? project.priority,
                startDate: startDate ? new Date(startDate) : project.startDate,
                endDate: endDate ? new Date(endDate) : project.endDate,
                budget: budget !== undefined ? Number(budget) : project.budget,
                progress: progress !== undefined ? Number(progress) : project.progress,
            },
        });
        return res.json(updated);
    }
    catch (error) {
        return next(error);
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        if (!id) {
            return res.status(400).json({ error: 'Project ID is required' });
        }
        const project = await prisma.project.findFirst({
            where: { id, companyId: user.companyId },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        await prisma.project.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map