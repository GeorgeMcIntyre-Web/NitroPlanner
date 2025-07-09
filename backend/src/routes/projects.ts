import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// GET /api/projects - List all projects (hardened, resilient)
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
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
  } catch (error) {
    return next(error);
  }
});

// GET /api/projects/:id - Get a single project (hardened)
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
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
  } catch (error) {
    return next(error);
  }
});

// POST /api/projects - Create a new project (hardened)
router.post(
  '/',
  authenticateToken,
  [
    body('name').isString().isLength({ min: 1, max: 200 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('budget').optional().isFloat({ min: 0 }),
    body('progress').optional().isFloat({ min: 0, max: 100 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const user = (req as any).user;
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
    } catch (error) {
      return next(error);
    }
  }
);

// PUT /api/projects/:id - Update a project (hardened)
router.put(
  '/:id',
  authenticateToken,
  [
    body('name').optional().isString().isLength({ min: 1, max: 200 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('budget').optional().isFloat({ min: 0 }),
    body('progress').optional().isFloat({ min: 0, max: 100 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }
      const user = (req as any).user;
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
    } catch (error) {
      return next(error);
    }
  }
);

// DELETE /api/projects/:id - Delete a project (hardened)
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
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
  } catch (error) {
    return next(error);
  }
});

export default router; 