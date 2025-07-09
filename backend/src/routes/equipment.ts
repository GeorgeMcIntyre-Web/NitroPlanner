import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// EQUIPMENT DIGITAL TWIN ENDPOINTS
// ============================================================================

// List all equipment (optionally filter by company)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const companyId = req.query.companyId as string | undefined;
  const where = companyId ? { companyId } : {};
  const equipment = await prisma.equipment.findMany({
    where,
    include: {
      equipmentStatus: true,
      equipmentCapacity: true,
      equipmentMetrics: true,
    },
    orderBy: { name: 'asc' },
  });
  return res.json(equipment);
});

// Get single equipment by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID is required' });
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      equipmentStatus: true,
      equipmentCapacity: true,
      equipmentMetrics: true,
      maintenanceHistory: true,
      operationHistory: true,
    },
  });
  if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
  return res.json(equipment);
});

// Create new equipment
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const equipment = await prisma.equipment.create({
      data: {
        ...data,
        equipmentStatus: { create: {} },
        equipmentCapacity: { create: {} },
        equipmentMetrics: { create: {} },
      },
      include: {
        equipmentStatus: true,
        equipmentCapacity: true,
        equipmentMetrics: true,
      },
    });
    return res.status(201).json(equipment);
  } catch (err) {
    return next(err);
  }
});

// Update equipment
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const data = req.body;
    const equipment = await prisma.equipment.update({
      where: { id },
      data,
      include: {
        equipmentStatus: true,
        equipmentCapacity: true,
        equipmentMetrics: true,
      },
    });
    return res.json(equipment);
  } catch (err) {
    return next(err);
  }
});

// Delete equipment
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    await prisma.equipment.delete({ where: { id } });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

// Assign equipment to a work unit
router.post('/:id/assign-workunit', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // equipmentId
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const { workUnitId } = req.body;
    if (!workUnitId) return res.status(400).json({ error: 'workUnitId is required' });
    // Update the work unit to assign this equipment
    const workUnit = await prisma.workUnit.update({
      where: { id: workUnitId },
      data: { assignedEquipmentId: id },
    });
    return res.json(workUnit);
  } catch (err) {
    return next(err);
  }
});

// Unassign equipment from a work unit
router.post('/:id/unassign-workunit', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // equipmentId
    if (!id) return res.status(400).json({ error: 'ID is required' });
    const { workUnitId } = req.body;
    if (!workUnitId) return res.status(400).json({ error: 'workUnitId is required' });
    // Update the work unit to remove equipment assignment
    const workUnit = await prisma.workUnit.update({
      where: { id: workUnitId },
      data: { assignedEquipmentId: null },
    });
    return res.json(workUnit);
  } catch (err) {
    return next(err);
  }
});

// Export the router
export default router; 