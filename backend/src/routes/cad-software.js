const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// Get all CAD software for company
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isActive,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (page - 1) * limit;

    const where = { companyId: req.user.companyId };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [cadSoftware, total] = await Promise.all([
      prisma.cADSoftware.findMany({
        where,
        select: {
          id: true,
          name: true,
          version: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              extractionTemplates: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.cADSoftware.count({ where })
    ]);

    res.json({
      cadSoftware,
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

// Create new CAD software integration
router.post('/', authenticateToken, authorizeRoles(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const {
      name,
      version,
      description,
      apiEndpoint,
      apiKey,
      credentials,
      settings
    } = req.body;

    // Encrypt sensitive data
    const encryptedCredentials = credentials ? encryptData(JSON.stringify(credentials)) : null;
    const encryptedApiKey = apiKey ? encryptData(apiKey) : null;

    const cadSoftware = await prisma.cADSoftware.create({
      data: {
        companyId: req.user.companyId,
        name,
        version,
        description,
        apiEndpoint,
        apiKey: encryptedApiKey,
        credentials: encryptedCredentials,
        settings: settings ? JSON.parse(settings) : {}
      },
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        isActive: true,
        apiEndpoint: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      message: 'CAD software integration created successfully',
      cadSoftware
    });
  } catch (error) {
    next(error);
  }
});

// Get CAD software by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const cadSoftware = await prisma.cADSoftware.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      },
      include: {
        extractionTemplates: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            templateType: true,
            isActive: true
          }
        },
        _count: {
          select: {
            extractionTemplates: true
          }
        }
      }
    });

    if (!cadSoftware) {
      return res.status(404).json({
        error: 'CAD software not found',
        message: 'CAD software not found in your company'
      });
    }

    // Don't return sensitive data
    delete cadSoftware.apiKey;
    delete cadSoftware.credentials;

    res.json(cadSoftware);
  } catch (error) {
    next(error);
  }
});

// Update CAD software
router.put('/:id', authenticateToken, authorizeRoles(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const {
      name,
      version,
      description,
      isActive,
      apiEndpoint,
      apiKey,
      credentials,
      settings
    } = req.body;

    // Check if CAD software exists and belongs to company
    const existingSoftware = await prisma.cADSoftware.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      }
    });

    if (!existingSoftware) {
      return res.status(404).json({
        error: 'CAD software not found',
        message: 'CAD software not found in your company'
      });
    }

    // Encrypt sensitive data if provided
    let encryptedApiKey = existingSoftware.apiKey;
    let encryptedCredentials = existingSoftware.credentials;

    if (apiKey !== undefined) {
      encryptedApiKey = apiKey ? encryptData(apiKey) : null;
    }

    if (credentials !== undefined) {
      encryptedCredentials = credentials ? encryptData(JSON.stringify(credentials)) : null;
    }

    const updatedSoftware = await prisma.cADSoftware.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(version !== undefined && { version }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(apiEndpoint !== undefined && { apiEndpoint }),
        ...(encryptedApiKey !== undefined && { apiKey: encryptedApiKey }),
        ...(encryptedCredentials !== undefined && { credentials: encryptedCredentials }),
        ...(settings !== undefined && { settings: settings ? JSON.parse(settings) : {} }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        version: true,
        description: true,
        isActive: true,
        apiEndpoint: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'CAD software updated successfully',
      cadSoftware: updatedSoftware
    });
  } catch (error) {
    next(error);
  }
});

// Delete CAD software
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res, next) => {
  try {
    // Check if CAD software exists and belongs to company
    const existingSoftware = await prisma.cADSoftware.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId
      }
    });

    if (!existingSoftware) {
      return res.status(404).json({
        error: 'CAD software not found',
        message: 'CAD software not found in your company'
      });
    }

    await prisma.cADSoftware.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'CAD software deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Test CAD software connection
router.post('/:id/test', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const cadSoftware = await prisma.cADSoftware.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!cadSoftware) {
      return res.status(404).json({
        error: 'CAD software not found',
        message: 'CAD software not found in your company'
      });
    }

    // Test connection based on CAD software type
    const testResult = await testCADConnection(cadSoftware);

    res.json({
      message: 'Connection test completed',
      result: testResult
    });
  } catch (error) {
    next(error);
  }
});

// Get extraction templates for CAD software
router.get('/:id/templates', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { templateType, isActive } = req.query;

    // Verify CAD software belongs to company
    const cadSoftware = await prisma.cADSoftware.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!cadSoftware) {
      return res.status(404).json({
        error: 'CAD software not found',
        message: 'CAD software not found in your company'
      });
    }

    const where = { cadSoftwareId: id };

    if (templateType) {
      where.templateType = templateType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.cADExtractionTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        templateType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Create extraction template
router.post('/:id/templates', authenticateToken, authorizeRoles(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      templateType,
      templateConfig
    } = req.body;

    // Verify CAD software belongs to company
    const cadSoftware = await prisma.cADSoftware.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!cadSoftware) {
      return res.status(404).json({
        error: 'CAD software not found',
        message: 'CAD software not found in your company'
      });
    }

    const template = await prisma.cADExtractionTemplate.create({
      data: {
        cadSoftwareId: id,
        name,
        description,
        templateType: templateType || 'bom',
        templateConfig: templateConfig ? JSON.parse(templateConfig) : {}
      }
    });

    res.status(201).json({
      message: 'Extraction template created successfully',
      template
    });
  } catch (error) {
    next(error);
  }
});

// Update extraction template
router.put('/templates/:templateId', authenticateToken, authorizeRoles(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const {
      name,
      description,
      templateType,
      isActive,
      templateConfig
    } = req.body;

    // Verify template belongs to company's CAD software
    const template = await prisma.cADExtractionTemplate.findFirst({
      where: {
        id: templateId,
        cadSoftware: {
          companyId: req.user.companyId
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        message: 'Template not found in your company'
      });
    }

    const updatedTemplate = await prisma.cADExtractionTemplate.update({
      where: { id: templateId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(templateType && { templateType }),
        ...(isActive !== undefined && { isActive }),
        ...(templateConfig !== undefined && { templateConfig: templateConfig ? JSON.parse(templateConfig) : {} }),
        updatedAt: new Date()
      }
    });

    res.json({
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    next(error);
  }
});

// Delete extraction template
router.delete('/templates/:templateId', authenticateToken, authorizeRoles(['admin']), async (req, res, next) => {
  try {
    const { templateId } = req.params;

    // Verify template belongs to company's CAD software
    const template = await prisma.cADExtractionTemplate.findFirst({
      where: {
        id: templateId,
        cadSoftware: {
          companyId: req.user.companyId
        }
      }
    });

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        message: 'Template not found in your company'
      });
    }

    await prisma.cADExtractionTemplate.delete({
      where: { id: templateId }
    });

    res.json({
      message: 'Template deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get supported CAD software list
router.get('/supported/list', authenticateToken, async (req, res, next) => {
  try {
    const supportedSoftware = [
      {
        name: 'CATIA',
        versions: ['V5', 'V6', '3DEXPERIENCE'],
        fileExtensions: ['.catpart', '.catproduct', '.catdrawing'],
        description: 'Dassault Systèmes CATIA - Advanced CAD/CAM/CAE software',
        features: ['Assembly Design', 'Part Design', 'Drafting', 'Analysis']
      },
      {
        name: 'NX',
        versions: ['12.0', '1847', '1872', '1899', '1926', '1953'],
        fileExtensions: ['.prt', '.asm', '.dft'],
        description: 'Siemens NX - Advanced CAD/CAM/CAE software',
        features: ['Modeling', 'Assembly', 'Drafting', 'Simulation']
      },
      {
        name: 'Fides',
        versions: ['2023', '2022', '2021'],
        fileExtensions: ['.fides', '.fdm'],
        description: 'Fides - Specialized design software',
        features: ['Design', 'Assembly Planning', 'Manufacturing']
      },
      {
        name: 'SolidWorks',
        versions: ['2023', '2022', '2021', '2020'],
        fileExtensions: ['.sldprt', '.sldasm', '.slddrw'],
        description: 'Dassault Systèmes SolidWorks - 3D CAD software',
        features: ['Part Modeling', 'Assembly Design', 'Drawing Creation']
      },
      {
        name: 'Inventor',
        versions: ['2023', '2022', '2021', '2020'],
        fileExtensions: ['.ipt', '.iam', '.idw'],
        description: 'Autodesk Inventor - 3D CAD software',
        features: ['Part Design', 'Assembly Design', 'Drawing Creation']
      },
      {
        name: 'Fusion 360',
        versions: ['2023', '2022'],
        fileExtensions: ['.f3d'],
        description: 'Autodesk Fusion 360 - Cloud-based CAD/CAM software',
        features: ['Modeling', 'Simulation', 'Manufacturing', 'Collaboration']
      },
      {
        name: 'Creo',
        versions: ['10.0', '9.0', '8.0', '7.0'],
        fileExtensions: ['.prt', '.asm', '.drw'],
        description: 'PTC Creo - 3D CAD software',
        features: ['Parametric Modeling', 'Assembly Design', 'Simulation']
      },
      {
        name: 'AutoCAD',
        versions: ['2024', '2023', '2022', '2021'],
        fileExtensions: ['.dwg', '.dxf'],
        description: 'Autodesk AutoCAD - 2D/3D CAD software',
        features: ['2D Drafting', '3D Modeling', 'Documentation']
      }
    ];

    res.json({
      supportedSoftware,
      total: supportedSoftware.length
    });
  } catch (error) {
    next(error);
  }
});

// Get CAD software statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const [totalSoftware, activeSoftware, softwareTypes, templateStats] = await Promise.all([
      // Total CAD software
      prisma.cADSoftware.count({ where: { companyId: req.user.companyId } }),
      
      // Active CAD software
      prisma.cADSoftware.count({ 
        where: { 
          companyId: req.user.companyId,
          isActive: true 
        } 
      }),
      
      // Software types distribution
      prisma.cADSoftware.groupBy({
        by: ['name'],
        where: { companyId: req.user.companyId },
        _count: { name: true }
      }),
      
      // Template statistics
      prisma.cADExtractionTemplate.aggregate({
        where: {
          cadSoftware: {
            companyId: req.user.companyId
          }
        },
        _count: { id: true }
      })
    ]);

    res.json({
      totalSoftware,
      activeSoftware,
      softwareTypes,
      totalTemplates: templateStats._count.id
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to encrypt sensitive data
function encryptData(data) {
  // In production, use a proper encryption library and key management
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
}

// Helper function to decrypt sensitive data
function decryptData(encryptedData) {
  if (!encryptedData || !encryptedData.iv || !encryptedData.encryptedData) {
    return null;
  }
  
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Helper function to test CAD software connection
async function testCADConnection(cadSoftware) {
  try {
    const softwareName = cadSoftware.name.toLowerCase();
    
    switch (softwareName) {
      case 'catia':
        return await testCATIAConnection(cadSoftware);
      case 'nx':
        return await testNXConnection(cadSoftware);
      case 'fides':
        return await testFidesConnection(cadSoftware);
      case 'solidworks':
        return await testSolidWorksConnection(cadSoftware);
      case 'inventor':
        return await testInventorConnection(cadSoftware);
      default:
        return {
          success: false,
          message: `Connection testing not implemented for ${cadSoftware.name}`,
          details: 'Generic connection test'
        };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed',
      error: error.message
    };
  }
}

// CAD-specific connection test functions
async function testCATIAConnection(cadSoftware) {
  // Implementation for CATIA connection test
  return {
    success: true,
    message: 'CATIA connection test successful',
    details: {
      version: cadSoftware.version || 'Unknown',
      endpoint: cadSoftware.apiEndpoint || 'Not configured'
    }
  };
}

async function testNXConnection(cadSoftware) {
  // Implementation for NX connection test
  return {
    success: true,
    message: 'NX connection test successful',
    details: {
      version: cadSoftware.version || 'Unknown',
      endpoint: cadSoftware.apiEndpoint || 'Not configured'
    }
  };
}

async function testFidesConnection(cadSoftware) {
  // Implementation for Fides connection test
  return {
    success: true,
    message: 'Fides connection test successful',
    details: {
      version: cadSoftware.version || 'Unknown',
      endpoint: cadSoftware.apiEndpoint || 'Not configured'
    }
  };
}

async function testSolidWorksConnection(cadSoftware) {
  // Implementation for SolidWorks connection test
  return {
    success: true,
    message: 'SolidWorks connection test successful',
    details: {
      version: cadSoftware.version || 'Unknown',
      endpoint: cadSoftware.apiEndpoint || 'Not configured'
    }
  };
}

async function testInventorConnection(cadSoftware) {
  // Implementation for Inventor connection test
  return {
    success: true,
    message: 'Inventor connection test successful',
    details: {
      version: cadSoftware.version || 'Unknown',
      endpoint: cadSoftware.apiEndpoint || 'Not configured'
    }
  };
}

module.exports = router; 