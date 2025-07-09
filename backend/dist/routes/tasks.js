"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        const tasks = await prisma.task.findMany({
            where: { project: { companyId: user.companyId } },
            include: {
                project: { select: { id: true, name: true, companyId: true } },
                assignedTo: { select: { id: true, username: true, firstName: true, lastName: true } }
            }
        });
        return res.json(tasks);
    }
    catch (error) {
        return next(error);
    }
    return null;
});
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        if (!id) {
            return res.status(400).json({ error: 'Task ID is required' });
        }
        const task = await prisma.task.findFirst({
            where: { id, project: { companyId: user.companyId } },
            include: {
                project: { select: { id: true, name: true, companyId: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } }
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        return res.json(task);
    }
    catch (error) {
        return next(error);
    }
    return null;
});
router.post('/', auth_1.authenticateToken, [
    (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('projectId').isString(),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'medium', 'high']),
    (0, express_validator_1.body)('status').optional().isIn(['todo', 'in_progress', 'done']),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 1000 })
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
        const { name, description, projectId, assignedToId, priority, status, kanbanColumn, estimatedHours, dueDate } = req.body;
        const project = await prisma.project.findFirst({ where: { id: projectId, companyId: user.companyId } });
        if (!project) {
            return res.status(403).json({ error: 'Cannot create task for a project outside your company' });
        }
        const task = await prisma.task.create({
            data: {
                name,
                description,
                projectId,
                assignedToId: assignedToId || null,
                priority: priority || 'medium',
                status: status || 'todo',
                kanbanColumn: kanbanColumn || null,
                estimatedHours: estimatedHours ? Number(estimatedHours) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                createdById: user.id
            },
            include: {
                project: { select: { id: true, name: true, companyId: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } }
            }
        });
        return res.status(201).json(task);
    }
    catch (error) {
        return next(error);
    }
    return null;
});
router.put('/:id', auth_1.authenticateToken, [
    (0, express_validator_1.body)('name').optional().isString().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'medium', 'high']),
    (0, express_validator_1.body)('status').optional().isIn(['todo', 'in_progress', 'done']),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 1000 })
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
            return res.status(400).json({ error: 'Task ID is required' });
        }
        const { name, description, assignedToId, priority, status, kanbanColumn, estimatedHours, actualHours, progress, dueDate, endDate } = req.body;
        const task = await prisma.task.findFirst({
            where: { id, project: { companyId: user.companyId } },
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const updateData = {
            name: name ?? task.name,
            description: description ?? task.description,
            assignedToId: assignedToId ?? task.assignedToId,
            priority: priority ?? task.priority,
            status: status ?? task.status,
            kanbanColumn: kanbanColumn ?? task.kanbanColumn,
            estimatedHours: estimatedHours ? Number(estimatedHours) : task.estimatedHours,
            actualHours: actualHours ? Number(actualHours) : task.actualHours,
            dueDate: dueDate ? new Date(dueDate) : task.dueDate,
            endDate: endDate ? new Date(endDate) : task.endDate
        };
        if (progress !== undefined) {
            updateData.progress = Number(progress);
        }
        const updated = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                project: { select: { id: true, name: true, companyId: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true, username: true } }
            }
        });
        return res.json(updated);
    }
    catch (error) {
        return next(error);
    }
    return null;
});
router.delete('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized: user or company not found' });
        }
        if (!id) {
            return res.status(400).json({ error: 'Task ID is required' });
        }
        const task = await prisma.task.findFirst({ where: { id, project: { companyId: user.companyId } } });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await prisma.task.delete({ where: { id } });
        return res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        return next(error);
    }
    return null;
});
exports.default = router;
//# sourceMappingURL=tasks.js.map