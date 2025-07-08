import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.csv', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, and Excel files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Export Projects
router.get('/export/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { companyId: req.user.companyId },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        workUnits: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            checkpoints: true
          }
        }
      }
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      companyId: req.user.companyId,
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.progress,
        budget: project.budget,
        tasks: project.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          startDate: task.startDate,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo ? {
            id: task.assignedTo.id,
            name: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
            email: task.assignedTo.email
          } : null
        })),
        workUnits: project.workUnits.map(workUnit => ({
          id: workUnit.id,
          name: workUnit.name,
          description: workUnit.description,
          workUnitType: workUnit.workUnitType,
          roleType: workUnit.roleType,
          status: workUnit.status,
          priority: workUnit.priority,
          progress: workUnit.progress,
          estimatedHours: workUnit.estimatedHours,
          actualHours: workUnit.actualHours,
          startDate: workUnit.startDate,
          endDate: workUnit.endDate,
          assignedTo: workUnit.assignedTo ? {
            id: workUnit.assignedTo.id,
            name: `${workUnit.assignedTo.firstName} ${workUnit.assignedTo.lastName}`,
            email: workUnit.assignedTo.email
          } : null,
          checkpoints: workUnit.checkpoints.map(checkpoint => ({
            id: checkpoint.id,
            name: checkpoint.name,
            description: checkpoint.description,
            checkpointType: checkpoint.checkpointType,
            status: checkpoint.status,
            dueDate: checkpoint.dueDate,
            completedDate: checkpoint.completedDate
          }))
        }))
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=nitroplanner-projects-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Export projects error:', error);
    res.status(500).json({ error: 'Failed to export projects' });
  }
});

// Export Work Units
router.get('/export/work-units', authenticateToken, async (req: Request, res: Response) => {
  try {
    const workUnits = await prisma.workUnit.findMany({
      where: {
        project: { companyId: req.user.companyId }
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
            email: true
          }
        },
        checkpoints: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        tasks: true
      }
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      companyId: req.user.companyId,
      workUnits: workUnits.map(workUnit => ({
        id: workUnit.id,
        name: workUnit.name,
        description: workUnit.description,
        workUnitType: workUnit.workUnitType,
        roleType: workUnit.roleType,
        status: workUnit.status,
        priority: workUnit.priority,
        progress: workUnit.progress,
        estimatedHours: workUnit.estimatedHours,
        actualHours: workUnit.actualHours,
        startDate: workUnit.startDate,
        endDate: workUnit.endDate,
        dependencies: workUnit.dependencies,
        simulationData: workUnit.simulationData,
        predictedDelay: workUnit.predictedDelay,
        riskScore: workUnit.riskScore,
        confidence: workUnit.confidence,
        project: {
          id: workUnit.project.id,
          name: workUnit.project.name
        },
        assignedTo: workUnit.assignedTo ? {
          id: workUnit.assignedTo.id,
          name: `${workUnit.assignedTo.firstName} ${workUnit.assignedTo.lastName}`,
          email: workUnit.assignedTo.email
        } : null,
        checkpoints: workUnit.checkpoints.map(checkpoint => ({
          id: checkpoint.id,
          name: checkpoint.name,
          description: checkpoint.description,
          checkpointType: checkpoint.checkpointType,
          status: checkpoint.status,
          requiredRole: checkpoint.requiredRole,
          dueDate: checkpoint.dueDate,
          completedDate: checkpoint.completedDate,
          notes: checkpoint.notes,
          assignedTo: checkpoint.assignedTo ? {
            id: checkpoint.assignedTo.id,
            name: `${checkpoint.assignedTo.firstName} ${checkpoint.assignedTo.lastName}`,
            email: checkpoint.assignedTo.email
          } : null
        })),
        tasks: workUnit.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          startDate: task.startDate,
          dueDate: task.dueDate
        }))
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=nitroplanner-work-units-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Export work units error:', error);
    res.status(500).json({ error: 'Failed to export work units' });
  }
});

// Export Templates
router.get('/export/templates', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [processTemplates, designTemplates] = await Promise.all([
      prisma.processTemplate.findMany({
        where: { companyId: req.user.companyId }
      }),
      prisma.designTemplate.findMany({
        where: { companyId: req.user.companyId }
      })
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      companyId: req.user.companyId,
      processTemplates,
      designTemplates
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=nitroplanner-templates-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Export templates error:', error);
    res.status(500).json({ error: 'Failed to export templates' });
  }
});

// Import Projects
router.post('/import/projects', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(fileContent);

    // Validate import data structure
    if (!importData.projects || !Array.isArray(importData.projects)) {
      return res.status(400).json({ error: 'Invalid file format. Expected projects array.' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const projectData of importData.projects) {
      try {
        // Create project
        const project = await prisma.project.create({
          data: {
            name: projectData.name,
            description: projectData.description || '',
            status: projectData.status || 'active',
            startDate: projectData.startDate ? new Date(projectData.startDate) : null,
            endDate: projectData.endDate ? new Date(projectData.endDate) : null,
            progress: projectData.progress || 0,
            budget: projectData.budget || 0,
            companyId: req.user.companyId,
            createdById: req.user.id
          }
        });

        // Import tasks
        if (projectData.tasks && Array.isArray(projectData.tasks)) {
          for (const taskData of projectData.tasks) {
            await prisma.task.create({
              data: {
                name: taskData.name,
                description: taskData.description || '',
                status: taskData.status || 'pending',
                priority: taskData.priority || 'medium',
                progress: taskData.progress || 0,
                estimatedHours: taskData.estimatedHours || null,
                actualHours: taskData.actualHours || null,
                startDate: taskData.startDate ? new Date(taskData.startDate) : null,
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
                projectId: project.id,
                assignedToId: taskData.assignedTo?.id || null,
                createdById: req.user.id
              }
            });
          }
        }

        // Import work units
        if (projectData.workUnits && Array.isArray(projectData.workUnits)) {
          for (const workUnitData of projectData.workUnits) {
            const workUnit = await prisma.workUnit.create({
              data: {
                name: workUnitData.name,
                description: workUnitData.description || '',
                workUnitType: workUnitData.workUnitType || 'design',
                roleType: workUnitData.roleType || 'mechanical_designer',
                status: workUnitData.status || 'pending',
                priority: workUnitData.priority || 'medium',
                progress: workUnitData.progress || 0,
                estimatedHours: workUnitData.estimatedHours || null,
                actualHours: workUnitData.actualHours || null,
                startDate: workUnitData.startDate ? new Date(workUnitData.startDate) : null,
                endDate: workUnitData.endDate ? new Date(workUnitData.endDate) : null,
                dependencies: workUnitData.dependencies || null,
                simulationData: workUnitData.simulationData || null,
                predictedDelay: workUnitData.predictedDelay || null,
                riskScore: workUnitData.riskScore || null,
                confidence: workUnitData.confidence || null,
                projectId: project.id,
                assignedToId: workUnitData.assignedTo?.id || null,
                createdById: req.user.id
              }
            });

            // Import checkpoints
            if (workUnitData.checkpoints && Array.isArray(workUnitData.checkpoints)) {
              for (const checkpointData of workUnitData.checkpoints) {
                await prisma.checkpoint.create({
                  data: {
                    name: checkpointData.name,
                    description: checkpointData.description || '',
                    checkpointType: checkpointData.checkpointType || 'quality_gate',
                    status: checkpointData.status || 'pending',
                    requiredRole: checkpointData.requiredRole || null,
                    dueDate: checkpointData.dueDate ? new Date(checkpointData.dueDate) : null,
                    completedDate: checkpointData.completedDate ? new Date(checkpointData.completedDate) : null,
                    notes: checkpointData.notes || null,
                    attachments: checkpointData.attachments || null,
                    workUnitId: workUnit.id,
                    assignedToId: checkpointData.assignedTo?.id || null
                  }
                });
              }
            }
          }
        }

        results.imported++;
      } catch (error) {
        console.error(`Error importing project ${projectData.name}:`, error);
        results.errors.push(`Failed to import project: ${projectData.name}`);
        results.skipped++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'Import completed',
      results
    });
  } catch (error) {
    console.error('Import projects error:', error);
    res.status(500).json({ error: 'Failed to import projects' });
  }
});

// Import Templates
router.post('/import/templates', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(fileContent);

    const results = {
      processTemplates: { imported: 0, skipped: 0 },
      designTemplates: { imported: 0, skipped: 0 },
      errors: [] as string[]
    };

    // Import process templates
    if (importData.processTemplates && Array.isArray(importData.processTemplates)) {
      for (const templateData of importData.processTemplates) {
        try {
          await prisma.processTemplate.create({
            data: {
              name: templateData.name,
              description: templateData.description || '',
              roleType: templateData.roleType,
              workUnitType: templateData.workUnitType,
              templateData: templateData.templateData,
              isActive: templateData.isActive !== false,
              companyId: req.user.companyId
            }
          });
          results.processTemplates.imported++;
        } catch (error) {
          console.error(`Error importing process template ${templateData.name}:`, error);
          results.errors.push(`Failed to import process template: ${templateData.name}`);
          results.processTemplates.skipped++;
        }
      }
    }

    // Import design templates
    if (importData.designTemplates && Array.isArray(importData.designTemplates)) {
      for (const templateData of importData.designTemplates) {
        try {
          await prisma.designTemplate.create({
            data: {
              name: templateData.name,
              description: templateData.description || '',
              designType: templateData.designType,
              industry: templateData.industry || null,
              templateData: templateData.templateData,
              isActive: templateData.isActive !== false,
              companyId: req.user.companyId
            }
          });
          results.designTemplates.imported++;
        } catch (error) {
          console.error(`Error importing design template ${templateData.name}:`, error);
          results.errors.push(`Failed to import design template: ${templateData.name}`);
          results.designTemplates.skipped++;
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'Templates import completed',
      results
    });
  } catch (error) {
    console.error('Import templates error:', error);
    res.status(500).json({ error: 'Failed to import templates' });
  }
});

export default router; 