const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for manufacturing file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/manufacturing');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
      '.mp4', '.avi', '.mov', '.wmv', '.flv',
      '.txt', '.csv', '.json', '.xml'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
  }
});

// Get all manufacturing instructions for project
router.get('/project/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      instructionType, 
      difficulty, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: req.user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    const where = { projectId };

    if (instructionType) {
      where.instructionType = instructionType;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [instructions, total] = await Promise.all([
      prisma.manufacturingInstruction.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          instructionType: true,
          difficulty: true,
          estimatedTime: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          designFile: {
            select: {
              id: true,
              filename: true,
              originalName: true
            }
          },
          _count: {
            select: {
              manufacturingSteps: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.manufacturingInstruction.count({ where })
    ]);

    res.json({
      instructions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new manufacturing instruction
router.post('/project/:projectId', authenticateToken, upload.array('attachments', 10), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      name, 
      description, 
      instructionType, 
      difficulty, 
      estimatedTime,
      designFileId,
      instructionData 
    } = req.body;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: req.user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    // Verify design file belongs to project (if provided)
    if (designFileId) {
      const designFile = await prisma.designFile.findFirst({
        where: {
          id: designFileId,
          projectId
        }
      });

      if (!designFile) {
        return res.status(404).json({
          error: 'Design file not found',
          message: 'Design file not found in this project'
        });
      }
    }

    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    const instruction = await prisma.manufacturingInstruction.create({
      data: {
        projectId,
        name,
        description,
        instructionType: instructionType || 'assembly',
        difficulty: difficulty || 'medium',
        estimatedTime: estimatedTime ? parseFloat(estimatedTime) : null,
        status: 'draft',
        instructionData: {
          ...(instructionData && JSON.parse(instructionData)),
          attachments,
          createdBy: req.user.id,
          createdAt: new Date().toISOString()
        },
        designFileId: designFileId || null
      },
      include: {
        designFile: {
          select: {
            id: true,
            filename: true,
            originalName: true
          }
        },
        _count: {
          select: {
            manufacturingSteps: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Manufacturing instruction created successfully',
      instruction
    });
  } catch (error) {
    next(error);
  }
});

// Get manufacturing instruction by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const instruction = await prisma.manufacturingInstruction.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        designFile: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            designType: true
          }
        },
        manufacturingSteps: {
          orderBy: { stepNumber: 'asc' }
        },
        _count: {
          select: {
            manufacturingSteps: true
          }
        }
      }
    });

    if (!instruction) {
      return res.status(404).json({
        error: 'Manufacturing instruction not found',
        message: 'Manufacturing instruction not found in your company'
      });
    }

    res.json(instruction);
  } catch (error) {
    next(error);
  }
});

// Update manufacturing instruction
router.put('/:id', authenticateToken, upload.array('attachments', 10), async (req, res, next) => {
  try {
    const { 
      name, 
      description, 
      instructionType, 
      difficulty, 
      estimatedTime,
      status,
      instructionData 
    } = req.body;

    // Check if instruction exists and belongs to company
    const existingInstruction = await prisma.manufacturingInstruction.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!existingInstruction) {
      return res.status(404).json({
        error: 'Manufacturing instruction not found',
        message: 'Manufacturing instruction not found in your company'
      });
    }

    // Process new uploaded files
    const newAttachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Merge with existing attachments
    const existingData = existingInstruction.instructionData || {};
    const updatedData = {
      ...existingData,
      ...(instructionData && JSON.parse(instructionData)),
      attachments: [...(existingData.attachments || []), ...newAttachments],
      updatedBy: req.user.id,
      updatedAt: new Date().toISOString()
    };

    const updatedInstruction = await prisma.manufacturingInstruction.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(instructionType && { instructionType }),
        ...(difficulty && { difficulty }),
        ...(estimatedTime !== undefined && { estimatedTime: estimatedTime ? parseFloat(estimatedTime) : null }),
        ...(status && { status }),
        instructionData: updatedData,
        updatedAt: new Date()
      },
      include: {
        designFile: {
          select: {
            id: true,
            filename: true,
            originalName: true
          }
        },
        _count: {
          select: {
            manufacturingSteps: true
          }
        }
      }
    });

    res.json({
      message: 'Manufacturing instruction updated successfully',
      instruction: updatedInstruction
    });
  } catch (error) {
    next(error);
  }
});

// Add manufacturing step
router.post('/:id/steps', authenticateToken, async (req, res, next) => {
  try {
    const { instructionId } = req.params;
    const {
      stepNumber,
      title,
      description,
      instructions,
      estimatedTime,
      requiredTools,
      requiredMaterials,
      safetyNotes,
      qualityChecks,
      attachments
    } = req.body;

    // Verify instruction belongs to user's company
    const instruction = await prisma.manufacturingInstruction.findFirst({
      where: {
        id: instructionId,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!instruction) {
      return res.status(404).json({
        error: 'Manufacturing instruction not found',
        message: 'Manufacturing instruction not found in your company'
      });
    }

    const step = await prisma.manufacturingStep.create({
      data: {
        instructionId,
        stepNumber: parseInt(stepNumber),
        title,
        description,
        instructions,
        estimatedTime: estimatedTime ? parseFloat(estimatedTime) : null,
        requiredTools: requiredTools ? JSON.parse(requiredTools) : [],
        requiredMaterials: requiredMaterials ? JSON.parse(requiredMaterials) : [],
        safetyNotes,
        qualityChecks: qualityChecks ? JSON.parse(qualityChecks) : [],
        attachments: attachments ? JSON.parse(attachments) : []
      }
    });

    res.status(201).json({
      message: 'Manufacturing step added successfully',
      step
    });
  } catch (error) {
    next(error);
  }
});

// Update manufacturing step
router.put('/steps/:stepId', authenticateToken, async (req, res, next) => {
  try {
    const { stepId } = req.params;
    const {
      stepNumber,
      title,
      description,
      instructions,
      estimatedTime,
      requiredTools,
      requiredMaterials,
      safetyNotes,
      qualityChecks,
      attachments
    } = req.body;

    // Verify step belongs to user's company
    const step = await prisma.manufacturingStep.findFirst({
      where: {
        id: stepId,
        instruction: {
          project: {
            companyId: req.user.companyId
          }
        }
      }
    });

    if (!step) {
      return res.status(404).json({
        error: 'Manufacturing step not found',
        message: 'Manufacturing step not found in your company'
      });
    }

    const updatedStep = await prisma.manufacturingStep.update({
      where: { id: stepId },
      data: {
        ...(stepNumber !== undefined && { stepNumber: parseInt(stepNumber) }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(estimatedTime !== undefined && { estimatedTime: estimatedTime ? parseFloat(estimatedTime) : null }),
        ...(requiredTools !== undefined && { requiredTools: requiredTools ? JSON.parse(requiredTools) : [] }),
        ...(requiredMaterials !== undefined && { requiredMaterials: requiredMaterials ? JSON.parse(requiredMaterials) : [] }),
        ...(safetyNotes !== undefined && { safetyNotes }),
        ...(qualityChecks !== undefined && { qualityChecks: qualityChecks ? JSON.parse(qualityChecks) : [] }),
        ...(attachments !== undefined && { attachments: attachments ? JSON.parse(attachments) : [] }),
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Manufacturing step updated successfully',
      step: updatedStep
    });
  } catch (error) {
    next(error);
  }
});

// Delete manufacturing step
router.delete('/steps/:stepId', authenticateToken, async (req, res, next) => {
  try {
    const { stepId } = req.params;

    // Verify step belongs to user's company
    const step = await prisma.manufacturingStep.findFirst({
      where: {
        id: stepId,
        instruction: {
          project: {
            companyId: req.user.companyId
          }
        }
      }
    });

    if (!step) {
      return res.status(404).json({
        error: 'Manufacturing step not found',
        message: 'Manufacturing step not found in your company'
      });
    }

    await prisma.manufacturingStep.delete({
      where: { id: stepId }
    });

    res.json({
      message: 'Manufacturing step deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Generate manufacturing instructions from BOM
router.post('/generate-from-bom/:bomId', authenticateToken, async (req, res, next) => {
  try {
    const { bomId } = req.params;
    const { instructionType, difficulty, template } = req.body;

    // Verify BOM belongs to user's company
    const bom = await prisma.billOfMaterials.findFirst({
      where: {
        id: bomId,
        project: {
          companyId: req.user.companyId
        }
      },
      include: {
        bomComponents: {
          orderBy: { partNumber: 'asc' }
        },
        project: true
      }
    });

    if (!bom) {
      return res.status(404).json({
        error: 'BOM not found',
        message: 'BOM not found in your company'
      });
    }

    // Generate manufacturing instructions based on BOM components
    const generatedInstructions = await generateInstructionsFromBOM(bom, {
      instructionType: instructionType || 'assembly',
      difficulty: difficulty || 'medium',
      template: template || 'standard'
    });

    res.json({
      message: 'Manufacturing instructions generated successfully',
      instructions: generatedInstructions
    });
  } catch (error) {
    next(error);
  }
});

// Get manufacturing statistics
router.get('/project/:projectId/stats', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        companyId: req.user.companyId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
        message: 'Project not found in your company'
      });
    }

    const [instructionCount, instructionTypes, difficulties, totalTime] = await Promise.all([
      // Total instruction count
      prisma.manufacturingInstruction.count({ where: { projectId } }),
      
      // Instruction types distribution
      prisma.manufacturingInstruction.groupBy({
        by: ['instructionType'],
        where: { projectId },
        _count: { instructionType: true }
      }),
      
      // Difficulty distribution
      prisma.manufacturingInstruction.groupBy({
        by: ['difficulty'],
        where: { projectId },
        _count: { difficulty: true }
      }),
      
      // Total estimated time
      prisma.manufacturingInstruction.aggregate({
        where: { projectId },
        _sum: { estimatedTime: true }
      })
    ]);

    res.json({
      instructionCount,
      instructionTypes,
      difficulties,
      totalEstimatedTime: totalTime._sum.estimatedTime || 0
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate manufacturing instructions from BOM
async function generateInstructionsFromBOM(bom, options) {
  const instructions = [];
  
  // Group components by type or assembly level
  const componentGroups = groupComponentsByType(bom.bomComponents);
  
  for (const [groupName, components] of Object.entries(componentGroups)) {
    const instruction = await prisma.manufacturingInstruction.create({
      data: {
        projectId: bom.projectId,
        name: `${groupName} Assembly Instructions`,
        description: `Manufacturing instructions for ${groupName.toLowerCase()} assembly`,
        instructionType: options.instructionType,
        difficulty: options.difficulty,
        estimatedTime: calculateEstimatedTime(components),
        status: 'draft',
        instructionData: {
          bomId: bom.id,
          componentCount: components.length,
          generatedFrom: 'bom',
          template: options.template,
          components: components.map(c => ({
            partNumber: c.partNumber,
            name: c.name,
            quantity: c.quantity,
            material: c.material
          }))
        }
      }
    });

    // Generate steps for this instruction
    await generateStepsForInstruction(instruction.id, components, options);
    
    instructions.push(instruction);
  }

  return instructions;
}

// Helper function to group components by type
function groupComponentsByType(components) {
  const groups = {};
  
  for (const component of components) {
    const type = determineComponentType(component);
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(component);
  }
  
  return groups;
}

// Helper function to determine component type
function determineComponentType(component) {
  const name = component.name.toLowerCase();
  
  if (name.includes('frame') || name.includes('structure')) return 'Structural';
  if (name.includes('motor') || name.includes('actuator')) return 'Mechanical';
  if (name.includes('sensor') || name.includes('controller')) return 'Electrical';
  if (name.includes('battery') || name.includes('cell')) return 'Power';
  if (name.includes('conveyor') || name.includes('transport')) return 'Transport';
  
  return 'General';
}

// Helper function to calculate estimated time
function calculateEstimatedTime(components) {
  // Base time per component type
  const timePerComponent = {
    'Structural': 30, // minutes
    'Mechanical': 45,
    'Electrical': 60,
    'Power': 90,
    'Transport': 40,
    'General': 25
  };
  
  let totalTime = 0;
  
  for (const component of components) {
    const type = determineComponentType(component);
    totalTime += timePerComponent[type] * component.quantity;
  }
  
  return totalTime;
}

// Helper function to generate steps for instruction
async function generateStepsForInstruction(instructionId, components, options) {
  const steps = [];
  
  // Sort components by complexity/type
  const sortedComponents = sortComponentsByComplexity(components);
  
  for (let i = 0; i < sortedComponents.length; i++) {
    const component = sortedComponents[i];
    const stepNumber = i + 1;
    
    const step = await prisma.manufacturingStep.create({
      data: {
        instructionId,
        stepNumber,
        title: `Install ${component.name}`,
        description: `Install ${component.name} (${component.partNumber})`,
        instructions: generateStepInstructions(component, options),
        estimatedTime: calculateStepTime(component),
        requiredTools: determineRequiredTools(component),
        requiredMaterials: [component.partNumber],
        safetyNotes: generateSafetyNotes(component),
        qualityChecks: generateQualityChecks(component)
      }
    });
    
    steps.push(step);
  }
  
  return steps;
}

// Helper function to sort components by complexity
function sortComponentsByComplexity(components) {
  const complexityOrder = ['Structural', 'Mechanical', 'Electrical', 'Power', 'Transport', 'General'];
  
  return components.sort((a, b) => {
    const aType = determineComponentType(a);
    const bType = determineComponentType(b);
    return complexityOrder.indexOf(aType) - complexityOrder.indexOf(bType);
  });
}

// Helper function to generate step instructions
function generateStepInstructions(component, options) {
  const type = determineComponentType(component);
  
  const baseInstructions = {
    'Structural': [
      'Verify component dimensions and specifications',
      'Prepare mounting surface',
      'Align component according to design specifications',
      'Secure component using specified fasteners',
      'Verify alignment and level'
    ],
    'Mechanical': [
      'Check component for damage',
      'Prepare mounting interface',
      'Install component with proper alignment',
      'Connect mechanical interfaces',
      'Test mechanical operation'
    ],
    'Electrical': [
      'Verify electrical specifications',
      'Prepare wiring and connections',
      'Install component with proper grounding',
      'Connect electrical interfaces',
      'Test electrical functionality'
    ],
    'Power': [
      'Verify power specifications',
      'Prepare power connections',
      'Install with proper safety measures',
      'Connect power interfaces',
      'Test power functionality'
    ],
    'Transport': [
      'Verify transport specifications',
      'Prepare mounting structure',
      'Install transport mechanism',
      'Connect drive systems',
      'Test transport operation'
    ],
    'General': [
      'Verify component specifications',
      'Prepare installation area',
      'Install component',
      'Secure component',
      'Verify installation'
    ]
  };
  
  return baseInstructions[type] || baseInstructions['General'];
}

// Helper function to calculate step time
function calculateStepTime(component) {
  const type = determineComponentType(component);
  const baseTime = {
    'Structural': 30,
    'Mechanical': 45,
    'Electrical': 60,
    'Power': 90,
    'Transport': 40,
    'General': 25
  };
  
  return baseTime[type] || 25;
}

// Helper function to determine required tools
function determineRequiredTools(component) {
  const type = determineComponentType(component);
  
  const tools = {
    'Structural': ['Wrench Set', 'Torque Wrench', 'Level', 'Measuring Tape'],
    'Mechanical': ['Screwdriver Set', 'Allen Keys', 'Torque Wrench', 'Alignment Tools'],
    'Electrical': ['Wire Strippers', 'Crimping Tool', 'Multimeter', 'Screwdriver Set'],
    'Power': ['Insulated Tools', 'Multimeter', 'Safety Equipment', 'Torque Wrench'],
    'Transport': ['Wrench Set', 'Alignment Tools', 'Measuring Tape', 'Level'],
    'General': ['Basic Tool Set', 'Measuring Tools']
  };
  
  return tools[type] || tools['General'];
}

// Helper function to generate safety notes
function generateSafetyNotes(component) {
  const type = determineComponentType(component);
  
  const safetyNotes = {
    'Structural': ['Use proper lifting equipment', 'Ensure stable mounting surface', 'Follow torque specifications'],
    'Mechanical': ['Ensure power is disconnected', 'Use proper PPE', 'Follow lockout/tagout procedures'],
    'Electrical': ['Ensure power is disconnected', 'Use insulated tools', 'Follow electrical safety procedures'],
    'Power': ['Ensure power is disconnected', 'Use proper PPE', 'Follow battery safety procedures'],
    'Transport': ['Ensure power is disconnected', 'Use proper lifting equipment', 'Follow safety procedures'],
    'General': ['Use proper PPE', 'Follow safety procedures']
  };
  
  return safetyNotes[type] || safetyNotes['General'];
}

// Helper function to generate quality checks
function generateQualityChecks(component) {
  const type = determineComponentType(component);
  
  const qualityChecks = {
    'Structural': ['Verify alignment', 'Check torque specifications', 'Inspect for damage'],
    'Mechanical': ['Test mechanical operation', 'Check alignment', 'Verify connections'],
    'Electrical': ['Test electrical functionality', 'Check connections', 'Verify specifications'],
    'Power': ['Test power functionality', 'Check connections', 'Verify safety measures'],
    'Transport': ['Test transport operation', 'Check alignment', 'Verify drive systems'],
    'General': ['Verify installation', 'Check connections', 'Test functionality']
  };
  
  return qualityChecks[type] || qualityChecks['General'];
}

module.exports = router; 