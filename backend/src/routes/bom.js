const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for BOM file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/bom');
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
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      '.csv', '.xlsx', '.xls', '.json', '.xml', '.txt',
      '.dwg', '.dxf', '.step', '.stp', '.iges', '.igs',
      '.sldprt', '.sldasm', '.prt', '.asm', '.catpart', '.catproduct'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
  }
});

// Get all BOMs for project
router.get('/project/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      bomType, 
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

    if (bomType) {
      where.bomType = bomType;
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

    const [boms, total] = await Promise.all([
      prisma.billOfMaterials.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          bomType: true,
          version: true,
          status: true,
          extractedFrom: true,
          extractionMethod: true,
          extractionDate: true,
          extractionStatus: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bomComponents: true,
              bomVersions: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.billOfMaterials.count({ where })
    ]);

    res.json({
      boms,
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

// Create new BOM
router.post('/project/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      name, 
      description, 
      bomType, 
      bomData 
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

    const bom = await prisma.billOfMaterials.create({
      data: {
        projectId,
        name,
        description,
        bomType: bomType || 'assembly',
        bomData: bomData || {}
      },
      include: {
        _count: {
          select: {
            bomComponents: true,
            bomVersions: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'BOM created successfully',
      bom
    });
  } catch (error) {
    next(error);
  }
});

// Extract BOM from CAD file
router.post('/extract/:designFileId', authenticateToken, upload.single('bomFile'), async (req, res, next) => {
  try {
    const { designFileId } = req.params;
    const { 
      extractionMethod = 'automatic',
      cadSoftware,
      templateId,
      options 
    } = req.body;

    // Verify design file belongs to user's company
    const designFile = await prisma.designFile.findFirst({
      where: {
        id: designFileId,
        project: {
          companyId: req.user.companyId
        }
      },
      include: {
        project: true
      }
    });

    if (!designFile) {
      return res.status(404).json({
        error: 'Design file not found',
        message: 'Design file not found in your company'
      });
    }

    // Create extraction job
    const extractionJob = await prisma.bOMExtractionJob.create({
      data: {
        projectId: designFile.projectId,
        designFileId,
        jobType: 'bom_extraction',
        status: 'pending',
        config: {
          extractionMethod,
          cadSoftware,
          templateId,
          options: options ? JSON.parse(options) : {},
          uploadedFile: req.file ? {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path
          } : null
        },
        createdById: req.user.id
      }
    });

    // Start extraction process (async)
    processBOMExtraction(extractionJob.id, designFile, req.file, {
      extractionMethod,
      cadSoftware,
      templateId,
      options: options ? JSON.parse(options) : {}
    });

    res.status(202).json({
      message: 'BOM extraction job started',
      jobId: extractionJob.id,
      status: 'pending'
    });
  } catch (error) {
    next(error);
  }
});

// Get extraction job status
router.get('/extract/job/:jobId', authenticateToken, async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.bOMExtractionJob.findFirst({
      where: {
        id: jobId,
        project: {
          companyId: req.user.companyId
        }
      },
      include: {
        designFile: {
          select: {
            id: true,
            filename: true,
            originalName: true
          }
        },
        bom: {
          select: {
            id: true,
            name: true,
            version: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({
        error: 'Extraction job not found',
        message: 'Extraction job not found in your company'
      });
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
});

// Get BOM by ID with components
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const bom = await prisma.billOfMaterials.findFirst({
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
        bomComponents: {
          include: {
            childComponents: {
              select: {
                id: true,
                partNumber: true,
                name: true,
                quantity: true,
                status: true
              }
            }
          },
          orderBy: { partNumber: 'asc' }
        },
        bomVersions: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            bomComponents: true,
            bomVersions: true
          }
        }
      }
    });

    if (!bom) {
      return res.status(404).json({
        error: 'BOM not found',
        message: 'BOM not found in your company'
      });
    }

    res.json(bom);
  } catch (error) {
    next(error);
  }
});

// Update BOM
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { 
      name, 
      description, 
      bomType, 
      status, 
      bomData 
    } = req.body;

    // Check if BOM exists and belongs to company
    const existingBom = await prisma.billOfMaterials.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!existingBom) {
      return res.status(404).json({
        error: 'BOM not found',
        message: 'BOM not found in your company'
      });
    }

    const updatedBom = await prisma.billOfMaterials.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(bomType && { bomType }),
        ...(status && { status }),
        ...(bomData && { bomData }),
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            bomComponents: true,
            bomVersions: true
          }
        }
      }
    });

    res.json({
      message: 'BOM updated successfully',
      bom: updatedBom
    });
  } catch (error) {
    next(error);
  }
});

// Add component to BOM
router.post('/:id/components', authenticateToken, async (req, res, next) => {
  try {
    const { bomId } = req.params;
    const {
      partNumber,
      name,
      description,
      quantity,
      unit,
      material,
      supplier,
      supplierPartNumber,
      cost,
      currency,
      leadTime,
      location,
      notes,
      parentComponentId,
      cadPartNumber,
      cadMaterial,
      cadProperties
    } = req.body;

    // Verify BOM belongs to user's company
    const bom = await prisma.billOfMaterials.findFirst({
      where: {
        id: bomId,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!bom) {
      return res.status(404).json({
        error: 'BOM not found',
        message: 'BOM not found in your company'
      });
    }

    // Verify parent component exists (if provided)
    if (parentComponentId) {
      const parentComponent = await prisma.bOMComponent.findFirst({
        where: {
          id: parentComponentId,
          bomId
        }
      });

      if (!parentComponent) {
        return res.status(404).json({
          error: 'Parent component not found',
          message: 'Parent component not found in this BOM'
        });
      }
    }

    const component = await prisma.bOMComponent.create({
      data: {
        bomId,
        partNumber,
        name,
        description,
        quantity: quantity || 1,
        unit: unit || 'pcs',
        material,
        supplier,
        supplierPartNumber,
        cost: cost ? parseFloat(cost) : null,
        currency: currency || 'USD',
        leadTime: leadTime ? parseInt(leadTime) : null,
        location,
        notes,
        parentComponentId,
        cadPartNumber,
        cadMaterial,
        cadProperties: cadProperties ? JSON.parse(cadProperties) : null
      }
    });

    res.status(201).json({
      message: 'Component added successfully',
      component
    });
  } catch (error) {
    next(error);
  }
});

// Update component
router.put('/components/:componentId', authenticateToken, async (req, res, next) => {
  try {
    const { componentId } = req.params;
    const {
      partNumber,
      name,
      description,
      quantity,
      unit,
      material,
      supplier,
      supplierPartNumber,
      cost,
      currency,
      leadTime,
      location,
      status,
      notes,
      cadPartNumber,
      cadMaterial,
      cadProperties
    } = req.body;

    // Verify component belongs to user's company
    const component = await prisma.bOMComponent.findFirst({
      where: {
        id: componentId,
        bom: {
          project: {
            companyId: req.user.companyId
          }
        }
      }
    });

    if (!component) {
      return res.status(404).json({
        error: 'Component not found',
        message: 'Component not found in your company'
      });
    }

    const updatedComponent = await prisma.bOMComponent.update({
      where: { id: componentId },
      data: {
        ...(partNumber && { partNumber }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity }),
        ...(unit && { unit }),
        ...(material !== undefined && { material }),
        ...(supplier !== undefined && { supplier }),
        ...(supplierPartNumber !== undefined && { supplierPartNumber }),
        ...(cost !== undefined && { cost: cost ? parseFloat(cost) : null }),
        ...(currency && { currency }),
        ...(leadTime !== undefined && { leadTime: leadTime ? parseInt(leadTime) : null }),
        ...(location !== undefined && { location }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(cadPartNumber !== undefined && { cadPartNumber }),
        ...(cadMaterial !== undefined && { cadMaterial }),
        ...(cadProperties !== undefined && { cadProperties: cadProperties ? JSON.parse(cadProperties) : null }),
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Component updated successfully',
      component: updatedComponent
    });
  } catch (error) {
    next(error);
  }
});

// Delete component
router.delete('/components/:componentId', authenticateToken, async (req, res, next) => {
  try {
    const { componentId } = req.params;

    // Verify component belongs to user's company
    const component = await prisma.bOMComponent.findFirst({
      where: {
        id: componentId,
        bom: {
          project: {
            companyId: req.user.companyId
          }
        }
      }
    });

    if (!component) {
      return res.status(404).json({
        error: 'Component not found',
        message: 'Component not found in your company'
      });
    }

    await prisma.bOMComponent.delete({
      where: { id: componentId }
    });

    res.json({
      message: 'Component deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Export BOM to various formats
router.get('/:id/export', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    // Verify BOM belongs to user's company
    const bom = await prisma.billOfMaterials.findFirst({
      where: {
        id,
        project: {
          companyId: req.user.companyId
        }
      },
      include: {
        bomComponents: {
          include: {
            childComponents: {
              select: {
                id: true,
                partNumber: true,
                name: true,
                quantity: true,
                material: true,
                cost: true
              }
            }
          },
          orderBy: { partNumber: 'asc' }
        }
      }
    });

    if (!bom) {
      return res.status(404).json({
        error: 'BOM not found',
        message: 'BOM not found in your company'
      });
    }

    let exportData;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'csv':
        exportData = convertBOMToCSV(bom);
        contentType = 'text/csv';
        filename = `${bom.name}_BOM.csv`;
        break;
      case 'xlsx':
        exportData = await convertBOMToXLSX(bom);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${bom.name}_BOM.xlsx`;
        break;
      case 'json':
      default:
        exportData = JSON.stringify(bom, null, 2);
        contentType = 'application/json';
        filename = `${bom.name}_BOM.json`;
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    next(error);
  }
});

// Get BOM statistics
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

    const [bomCount, bomTypes, extractionStats, componentStats] = await Promise.all([
      // Total BOM count
      prisma.billOfMaterials.count({ where: { projectId } }),
      
      // BOM types distribution
      prisma.billOfMaterials.groupBy({
        by: ['bomType'],
        where: { projectId },
        _count: { bomType: true }
      }),
      
      // Extraction statistics
      prisma.bOMExtractionJob.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true }
      }),
      
      // Component statistics
      prisma.bOMComponent.aggregate({
        where: {
          bom: { projectId }
        },
        _count: { id: true },
        _sum: { cost: true }
      })
    ]);

    res.json({
      bomCount,
      bomTypes,
      extractionStats,
      componentStats: {
        totalComponents: componentStats._count.id,
        totalCost: componentStats._sum.cost || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to process BOM extraction
async function processBOMExtraction(jobId, designFile, uploadedFile, config) {
  try {
    // Update job status to in progress
    await prisma.bOMExtractionJob.update({
      where: { id: jobId },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
        progress: 10
      }
    });

    let extractedData = null;
    let cadSoftware = config.cadSoftware || 'unknown';

    // Determine CAD software from file extension or config
    if (!cadSoftware || cadSoftware === 'auto') {
      const ext = path.extname(designFile.originalName).toLowerCase();
      cadSoftware = detectCADSoftware(ext);
    }

    // Extract BOM based on CAD software
    switch (cadSoftware.toLowerCase()) {
      case 'catia':
        extractedData = await extractFromCATIA(designFile, uploadedFile, config);
        break;
      case 'nx':
        extractedData = await extractFromNX(designFile, uploadedFile, config);
        break;
      case 'fides':
        extractedData = await extractFromFides(designFile, uploadedFile, config);
        break;
      case 'solidworks':
        extractedData = await extractFromSolidWorks(designFile, uploadedFile, config);
        break;
      case 'inventor':
        extractedData = await extractFromInventor(designFile, uploadedFile, config);
        break;
      default:
        extractedData = await extractGeneric(designFile, uploadedFile, config);
    }

    // Update progress
    await prisma.bOMExtractionJob.update({
      where: { id: jobId },
      data: { progress: 80 }
    });

    // Create or update BOM
    let bom;
    if (extractedData.bomId) {
      // Update existing BOM
      bom = await prisma.billOfMaterials.update({
        where: { id: extractedData.bomId },
        data: {
          bomData: extractedData.bomData,
          extractedFrom: cadSoftware,
          extractionMethod: config.extractionMethod,
          extractionDate: new Date(),
          extractionStatus: 'completed',
          extractionLog: extractedData.log || 'Extraction completed successfully'
        }
      });
    } else {
      // Create new BOM
      bom = await prisma.billOfMaterials.create({
        data: {
          projectId: designFile.projectId,
          designFileId: designFile.id,
          name: extractedData.name || `BOM from ${designFile.originalName}`,
          description: extractedData.description || 'Extracted from CAD file',
          bomType: extractedData.bomType || 'assembly',
          bomData: extractedData.bomData,
          extractedFrom: cadSoftware,
          extractionMethod: config.extractionMethod,
          extractionDate: new Date(),
          extractionStatus: 'completed',
          extractionLog: extractedData.log || 'Extraction completed successfully'
        }
      });
    }

    // Create components if provided
    if (extractedData.components && extractedData.components.length > 0) {
      for (const componentData of extractedData.components) {
        await prisma.bOMComponent.create({
          data: {
            bomId: bom.id,
            ...componentData
          }
        });
      }
    }

    // Update job as completed
    await prisma.bOMExtractionJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        bomId: bom.id,
        resultData: {
          bomId: bom.id,
          extractedComponents: extractedData.components?.length || 0,
          cadSoftware,
          extractionMethod: config.extractionMethod
        }
      }
    });

  } catch (error) {
    console.error('BOM extraction error:', error);
    
    // Update job as failed
    await prisma.bOMExtractionJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      }
    });
  }
}

// Helper function to detect CAD software from file extension
function detectCADSoftware(fileExtension) {
  const extensionMap = {
    '.catpart': 'catia',
    '.catproduct': 'catia',
    '.catdrawing': 'catia',
    '.prt': 'nx',
    '.asm': 'nx',
    '.dft': 'nx',
    '.sldprt': 'solidworks',
    '.sldasm': 'solidworks',
    '.slddrw': 'solidworks',
    '.ipt': 'inventor',
    '.iam': 'inventor',
    '.idw': 'inventor',
    '.f3d': 'fusion360',
    '.skp': 'sketchup',
    '.blend': 'blender'
  };

  return extensionMap[fileExtension.toLowerCase()] || 'generic';
}

// CAD-specific extraction functions
async function extractFromCATIA(designFile, uploadedFile, config) {
  // Implementation for CATIA extraction
  // This would integrate with CATIA APIs or parse CATIA files
  return {
    name: `CATIA BOM - ${designFile.originalName}`,
    bomType: 'assembly',
    bomData: {
      software: 'CATIA',
      version: 'V6',
      extractionMethod: config.extractionMethod
    },
    components: [],
    log: 'CATIA extraction completed'
  };
}

async function extractFromNX(designFile, uploadedFile, config) {
  // Implementation for NX extraction
  return {
    name: `NX BOM - ${designFile.originalName}`,
    bomType: 'assembly',
    bomData: {
      software: 'NX',
      version: '12.0',
      extractionMethod: config.extractionMethod
    },
    components: [],
    log: 'NX extraction completed'
  };
}

async function extractFromFides(designFile, uploadedFile, config) {
  // Implementation for Fides extraction
  return {
    name: `Fides BOM - ${designFile.originalName}`,
    bomType: 'assembly',
    bomData: {
      software: 'Fides',
      version: '2023',
      extractionMethod: config.extractionMethod
    },
    components: [],
    log: 'Fides extraction completed'
  };
}

async function extractFromSolidWorks(designFile, uploadedFile, config) {
  // Implementation for SolidWorks extraction
  return {
    name: `SolidWorks BOM - ${designFile.originalName}`,
    bomType: 'assembly',
    bomData: {
      software: 'SolidWorks',
      version: '2023',
      extractionMethod: config.extractionMethod
    },
    components: [],
    log: 'SolidWorks extraction completed'
  };
}

async function extractFromInventor(designFile, uploadedFile, config) {
  // Implementation for Inventor extraction
  return {
    name: `Inventor BOM - ${designFile.originalName}`,
    bomType: 'assembly',
    bomData: {
      software: 'Inventor',
      version: '2023',
      extractionMethod: config.extractionMethod
    },
    components: [],
    log: 'Inventor extraction completed'
  };
}

async function extractGeneric(designFile, uploadedFile, config) {
  // Generic extraction for unknown CAD software
  return {
    name: `Generic BOM - ${designFile.originalName}`,
    bomType: 'assembly',
    bomData: {
      software: 'unknown',
      extractionMethod: config.extractionMethod
    },
    components: [],
    log: 'Generic extraction completed'
  };
}

// Helper function to convert BOM to CSV
function convertBOMToCSV(bom) {
  const headers = ['Part Number', 'Name', 'Description', 'Quantity', 'Unit', 'Material', 'Supplier', 'Cost', 'Currency'];
  const rows = [headers.join(',')];

  function addComponents(components, level = 0) {
    for (const component of components) {
      const indent = '  '.repeat(level);
      const row = [
        indent + component.partNumber,
        component.name,
        component.description || '',
        component.quantity,
        component.unit,
        component.material || '',
        component.supplier || '',
        component.cost || '',
        component.currency
      ].map(field => `"${field}"`).join(',');
      
      rows.push(row);
      
      if (component.childComponents && component.childComponents.length > 0) {
        addComponents(component.childComponents, level + 1);
      }
    }
  }

  addComponents(bom.bomComponents);
  return rows.join('\n');
}

// Helper function to convert BOM to XLSX
async function convertBOMToXLSX(bom) {
  // This would use a library like 'xlsx' to create Excel files
  // For now, return a simple JSON representation
  return JSON.stringify(bom, null, 2);
}

module.exports = router; 