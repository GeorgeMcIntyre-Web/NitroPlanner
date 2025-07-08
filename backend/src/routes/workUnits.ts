import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all work units
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
  } catch (error) {
    console.error('Error fetching work units:', error);
    res.status(500).json({ error: 'Failed to fetch work units' });
  }
});

// Get work unit by ID
router.get('/:id', async (req, res) => {
  try {
    const workUnitId = parseInt(req.params.id);
    const workUnit = await prisma.workUnit.findUnique({
      where: { id: workUnitId },
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

    if (!workUnit) {
      return res.status(404).json({ error: 'Work unit not found' });
    }

    res.json(workUnit);
  } catch (error) {
    console.error('Error fetching work unit:', error);
    res.status(500).json({ error: 'Failed to fetch work unit' });
  }
});

// Create new work unit
router.post('/', async (req, res) => {
  try {
    const { name, description, projectId, unitType, estimatedDuration, assignedTo, startDate } = req.body;

    const workUnit = await prisma.workUnit.create({
      data: {
        name,
        description,
        projectId: parseInt(projectId),
        unitType,
        estimatedDuration: estimatedDuration ? parseFloat(estimatedDuration) : null,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
        startDate: startDate ? new Date(startDate) : null
      },
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

    res.status(201).json(workUnit);
  } catch (error) {
    console.error('Error creating work unit:', error);
    res.status(500).json({ error: 'Failed to create work unit' });
  }
});

// Update work unit
router.put('/:id', async (req, res) => {
  try {
    const workUnitId = parseInt(req.params.id);
    const { name, description, unitType, estimatedDuration, actualDuration, status, assignedTo, startDate, completedDate } = req.body;

    const workUnit = await prisma.workUnit.update({
      where: { id: workUnitId },
      data: {
        name,
        description,
        unitType,
        estimatedDuration: estimatedDuration ? parseFloat(estimatedDuration) : null,
        actualDuration: actualDuration ? parseFloat(actualDuration) : null,
        status,
        assignedTo: assignedTo ? parseInt(assignedTo) : null,
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
        checkpoints: true
      }
    });

    res.json(workUnit);
  } catch (error) {
    console.error('Error updating work unit:', error);
    res.status(500).json({ error: 'Failed to update work unit' });
  }
});

// Delete work unit
router.delete('/:id', async (req, res) => {
  try {
    const workUnitId = parseInt(req.params.id);
    await prisma.workUnit.delete({
      where: { id: workUnitId }
    });

    res.json({ message: 'Work unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting work unit:', error);
    res.status(500).json({ error: 'Failed to delete work unit' });
  }
});

export default router; 