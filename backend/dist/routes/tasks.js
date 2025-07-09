"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
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
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        res.json(tasks);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        if (!taskId) {
            res.status(400).json({ error: 'Task ID is required' });
            return;
        }
        const task = await prisma.task.findUnique({
            where: { id: taskId },
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
                        username: true
                    }
                }
            }
        });
        if (!task) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        res.json(task);
        return;
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
        return;
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, description, projectId, assignedToId, priority, status, kanbanColumn, estimatedHours, dueDate } = req.body;
        const task = await prisma.task.create({
            data: {
                name: name,
                description: description,
                projectId: projectId,
                assignedToId: assignedToId || null,
                priority: priority,
                status: status,
                kanbanColumn: kanbanColumn,
                estimatedHours: estimatedHours ? Number(estimatedHours) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                createdById: req.user?.id || 'system'
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
                        username: true
                    }
                }
            }
        });
        res.status(201).json(task);
        return;
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
        return;
    }
});
router.put('/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        if (!taskId) {
            res.status(400).json({ error: 'Task ID is required' });
            return;
        }
        const { name, description, assignedToId, priority, status, kanbanColumn, estimatedHours, actualHours, progress, dueDate, endDate } = req.body;
        const updateData = {
            name: name,
            description: description,
            assignedToId: assignedToId || null,
            priority: priority,
            status: status,
            kanbanColumn: kanbanColumn,
            estimatedHours: estimatedHours ? Number(estimatedHours) : null,
            actualHours: actualHours ? Number(actualHours) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            endDate: endDate ? new Date(endDate) : null
        };
        if (progress !== undefined) {
            updateData.progress = Number(progress);
        }
        const task = await prisma.task.update({
            where: { id: taskId },
            data: updateData,
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
                        username: true
                    }
                }
            }
        });
        res.json(task);
        return;
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
        return;
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        if (!taskId) {
            res.status(400).json({ error: 'Task ID is required' });
            return;
        }
        await prisma.task.delete({
            where: { id: taskId }
        });
        res.json({ message: 'Task deleted successfully' });
        return;
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
        return;
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map