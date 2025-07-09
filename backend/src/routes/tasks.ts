import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks
router.get('/', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
    return;
  }
});

// Create new task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, projectId, assignedToId, priority, status, kanbanColumn, estimatedHours, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        name: name as string,
        description: description as string,
        projectId: projectId as string,
        assignedToId: assignedToId || null,
        priority: priority as string,
        status: status as string,
        kanbanColumn: kanbanColumn as string,
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: (req as any).user?.id || 'system' // Add createdById
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
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
    return;
  }
});

// Update task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    if (!taskId) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }
    
    const { name, description, assignedToId, priority, status, kanbanColumn, estimatedHours, actualHours, progress, dueDate, endDate } = req.body;

    const updateData: any = {
      name: name as string,
      description: description as string,
      assignedToId: assignedToId as string || null,
      priority: priority as string,
      status: status as string,
      kanbanColumn: kanbanColumn as string,
      estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      actualHours: actualHours ? Number(actualHours) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };

    // Handle progress field properly
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
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
    return;
  }
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
    return;
  }
});

export default router; 