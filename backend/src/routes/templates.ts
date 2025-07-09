import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/templates - List all templates
router.get('/', async (req: Request, res: Response) => {
  // TODO: Add filtering, pagination, auth
  const templates = await prisma.processTemplate.findMany();
  res.json(templates);
});

// POST /api/templates - Create a new template
router.post('/', async (req: Request, res: Response) => {
  // TODO: Validate input, get user from auth
  const { name, description, roleType, workUnitType, templateData, companyId } = req.body;
  const template = await prisma.processTemplate.create({
    data: { name, description, roleType, workUnitType, templateData, companyId }
  });
  res.status(201).json(template);
});

// Get template by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Template ID is required' });
      return;
    }
    
    const template = await prisma.processTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(template);
    return;
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
    return;
  }
});

// POST /api/projects/:proj_id/apply-template/:template_id - Apply template to project
router.post('/apply-template', async (req: Request, res: Response) => {
  // TODO: Implement logic to create project steps/tasks from template
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router; 