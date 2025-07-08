import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/templates - List all templates
router.get('/', async (req, res) => {
  // TODO: Add filtering, pagination, auth
  const templates = await prisma.processTemplate.findMany({
    include: { steps: true }
  });
  res.json(templates);
});

// POST /api/templates - Create a new template
router.post('/', async (req, res) => {
  // TODO: Validate input, get user from auth
  const { name, description, createdBy } = req.body;
  const template = await prisma.processTemplate.create({
    data: { name, description, createdBy }
  });
  res.status(201).json(template);
});

// GET /api/templates/:id - Get a template with steps
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const template = await prisma.processTemplate.findUnique({
    where: { id },
    include: { steps: true }
  });
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

// POST /api/templates/:id/steps - Add a step to a template
router.post('/:id/steps', async (req, res) => {
  const templateId = Number(req.params.id);
  const { stepName, sequenceOrder, baselineTimeHours, assignmentType, assignedRoleId, assignedMachineId, dependencyStepId } = req.body;
  const step = await prisma.templateStep.create({
    data: {
      templateId,
      stepName,
      sequenceOrder,
      baselineTimeHours,
      assignmentType,
      assignedRoleId,
      assignedMachineId,
      dependencyStepId
    }
  });
  res.status(201).json(step);
});

// PUT /api/templates/steps/:step_id - Update a step
router.put('/steps/:step_id', async (req, res) => {
  const id = Number(req.params.step_id);
  const data = req.body;
  const step = await prisma.templateStep.update({
    where: { id },
    data
  });
  res.json(step);
});

// DELETE /api/templates/steps/:step_id - Delete a step
router.delete('/steps/:step_id', async (req, res) => {
  const id = Number(req.params.step_id);
  await prisma.templateStep.delete({ where: { id } });
  res.status(204).end();
});

// POST /api/projects/:proj_id/apply-template/:template_id - Apply template to project
router.post('/apply-template', async (req, res) => {
  // TODO: Implement logic to create project steps/tasks from template
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router; 