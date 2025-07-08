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
                assignee: {
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
        const taskId = parseInt(req.params.id);
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, description, projectId, assignedTo, priority, status, kanbanColumn, estimatedHours, dueDate } = req.body;
        const task = await prisma.task.create({
            data: {
                name,
                description,
                projectId: parseInt(projectId),
                assignedTo: assignedTo ? parseInt(assignedTo) : null,
                priority: priority || 'medium',
                status: status || 'pending',
                kanbanColumn: kanbanColumn || 'backlog',
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
                dueDate: dueDate ? new Date(dueDate) : null
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { name, description, assignedTo, priority, status, kanbanColumn, estimatedHours, actualHours, progress, dueDate, startDate, completedDate } = req.body;
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                name,
                description,
                assignedTo: assignedTo ? parseInt(assignedTo) : null,
                priority,
                status,
                kanbanColumn,
                estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
                actualHours: actualHours ? parseFloat(actualHours) : null,
                progress: progress ? parseInt(progress) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                startDate: startDate ? new Date(startDate) : null,
                completedDate: completedDate ? new Date(completedDate) : null
            },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        res.json(task);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        await prisma.task.delete({
            where: { id: taskId }
        });
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map