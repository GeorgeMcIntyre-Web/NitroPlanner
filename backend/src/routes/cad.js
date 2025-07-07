const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads with enhanced settings
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/designs');
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
    fileSize: 500 * 1024 * 1024 // 500MB limit for large design files
  },
  fileFilter: (req, file, cb) => {
    // Comprehensive list of design file extensions
    const allowedExtensions = [
      // CAD files
      '.dwg', '.dxf', '.step', '.stp', '.iges', '.igs', '.stl', '.obj', '.3ds', '.max',
      // SolidWorks
      '.sldprt', '.sldasm', '.slddrw',
      // Inventor
      '.ipt', '.iam', '.idw',
      // Pro/E, Creo
      '.prt', '.asm', '.drw',
      // CATIA
      '.catpart', '.catproduct', '.catdrawing',
      // NX
      '.prt', '.asm', '.dft',
      // AutoCAD
      '.dwg', '.dxf', '.dwt',
      // Fusion 360
      '.f3d',
      // SketchUp
      '.skp',
      // Blender
      '.blend',
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
      // Documents
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      // Text files
      '.txt', '.csv', '.json', '.xml',
      // Archives
      '.zip', '.rar', '.7z'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
  }
});

// Get all design files for project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      designType, 
      designStage, 
      status, 
      search,
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Verify project belongs to company
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

    if (designType) {
      where.designType = designType;
    }

    if (designStage) {
      where.designStage = designStage;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { metadata: { path: ['description'], string_contains: search } }
      ];
    }

    const [files, total] = await Promise.all([
      prisma.designFile.findMany({
        where,
        select: {
          id: true,
          filename: true,
          originalName: true,
          fileType: true,
          fileSize: true,
          designType: true,
          designStage: true,
          version: true,
          revision: true,
          status: true,
          uploadedAt: true,
          metadata: true,
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          workUnit: {
            select: {
              id: true,
              name: true,
              workUnitType: true
            }
          },
          _count: {
            select: {
              designVersions: true,
              designReviews: true,
              childFiles: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.designFile.count({ where })
    ]);

    res.json({
      files,
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

// Upload design file with comprehensive metadata
router.post('/upload/:projectId', upload.single('designFile'), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { 
      description, 
      version, 
      revision, 
      designType, 
      designStage, 
      tags, 
      workUnitId,
      parentFileId,
      metadata 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a design file to upload'
      });
    }

    // Verify project belongs to company
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

    // Verify work unit belongs to project (if provided)
    if (workUnitId) {
      const workUnit = await prisma.workUnit.findFirst({
        where: {
          id: workUnitId,
          projectId
        }
      });

      if (!workUnit) {
        return res.status(404).json({
          error: 'Work unit not found',
          message: 'Work unit not found in this project'
        });
      }
    }

    // Verify parent file exists (if provided)
    if (parentFileId) {
      const parentFile = await prisma.designFile.findFirst({
        where: {
          id: parentFileId,
          projectId
        }
      });

      if (!parentFile) {
        return res.status(404).json({
          error: 'Parent file not found',
          message: 'Parent file not found in this project'
        });
      }
    }

    // Calculate file hash for deduplication
    const fileBuffer = await fs.readFile(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Check for duplicate files
    const existingFile = await prisma.designFile.findFirst({
      where: {
        fileHash,
        projectId
      }
    });

    if (existingFile) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      
      return res.status(409).json({
        error: 'Duplicate file',
        message: 'This file has already been uploaded to this project',
        existingFile: {
          id: existingFile.id,
          filename: existingFile.filename,
          uploadedAt: existingFile.uploadedAt
        }
      });
    }

    // Extract file metadata
    const fileType = path.extname(req.file.originalname).toLowerCase();
    const fileSize = req.file.size;
    
    // Parse additional metadata
    const parsedMetadata = {
      originalName: req.file.originalname,
      description: description || '',
      version: version || '1.0',
      revision: revision || null,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      uploadedBy: req.user.id,
      uploadDate: new Date().toISOString(),
      fileProperties: {
        mimeType: req.file.mimetype,
        encoding: req.file.encoding
      },
      ...(metadata && JSON.parse(metadata))
    };

    // Create design file record
    const designFile = await prisma.designFile.create({
      data: {
        projectId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType,
        fileSize,
        filePath: req.file.path,
        fileHash,
        designType: designType || 'cad',
        designStage: designStage || 'concept',
        version: version || '1.0',
        revision: revision || null,
        status: 'draft',
        metadata: parsedMetadata,
        workUnitId: workUnitId || null,
        parentFileId: parentFileId || null,
        uploadedById: req.user.id
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        workUnit: {
          select: {
            id: true,
            name: true,
            workUnitType: true
          }
        },
        parentFile: {
          select: {
            id: true,
            filename: true,
            originalName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Design file uploaded successfully',
      file: designFile
    });
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
    }
    next(error);
  }
});

// Get design file by ID with full details
router.get('/:id', async (req, res, next) => {
  try {
    const designFile = await prisma.designFile.findFirst({
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
        workUnit: {
          select: {
            id: true,
            name: true,
            workUnitType: true,
            status: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        parentFile: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            version: true
          }
        },
        childFiles: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            version: true,
            status: true
          }
        },
        designVersions: {
          select: {
            id: true,
            version: true,
            revision: true,
            changeLog: true,
            changeType: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        designReviews: {
          select: {
            id: true,
            reviewType: true,
            status: true,
            comments: true,
            rating: true,
            createdAt: true,
            completedAt: true,
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!designFile) {
      return res.status(404).json({
        error: 'Design file not found',
        message: 'Design file not found in your company'
      });
    }

    res.json(designFile);
  } catch (error) {
    next(error);
  }
});

// Download design file
router.get('/:id/download', async (req, res, next) => {
  try {
    const designFile = await prisma.designFile.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!designFile) {
      return res.status(404).json({
        error: 'Design file not found',
        message: 'Design file not found in your company'
      });
    }

    // Check if file exists
    try {
      await fs.access(designFile.filePath);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The design file is no longer available on the server'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${designFile.originalName}"`);
    res.setHeader('Content-Length', designFile.fileSize);

    // Stream the file
    const fileStream = require('fs').createReadStream(designFile.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// Update design file metadata
router.put('/:id', async (req, res, next) => {
  try {
    const { 
      description, 
      version, 
      revision, 
      designType, 
      designStage, 
      status, 
      tags, 
      metadata 
    } = req.body;

    // Check if design file exists and belongs to company
    const existingFile = await prisma.designFile.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!existingFile) {
      return res.status(404).json({
        error: 'Design file not found',
        message: 'Design file not found in your company'
      });
    }

    // Update metadata
    const updatedMetadata = {
      ...existingFile.metadata,
      description: description || existingFile.metadata.description,
      version: version || existingFile.metadata.version,
      revision: revision || existingFile.metadata.revision,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : existingFile.metadata.tags,
      lastModified: new Date().toISOString(),
      modifiedBy: req.user.id,
      ...(metadata && JSON.parse(metadata))
    };

    const updatedFile = await prisma.designFile.update({
      where: { id: req.params.id },
      data: {
        ...(designType && { designType }),
        ...(designStage && { designStage }),
        ...(version && { version }),
        ...(revision !== undefined && { revision }),
        ...(status && { status }),
        metadata: updatedMetadata
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Design file metadata updated successfully',
      file: updatedFile
    });
  } catch (error) {
    next(error);
  }
});

// Create new version of design file
router.post('/:id/version', async (req, res, next) => {
  try {
    const { version, revision, changeLog, changeType } = req.body;

    // Check if design file exists and belongs to company
    const designFile = await prisma.designFile.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!designFile) {
      return res.status(404).json({
        error: 'Design file not found',
        message: 'Design file not found in your company'
      });
    }

    const designVersion = await prisma.designVersion.create({
      data: {
        projectId: designFile.projectId,
        designFileId: designFile.id,
        version: version || '1.1',
        revision: revision || null,
        changeLog: changeLog || 'Version update',
        changeType: changeType || 'minor'
      }
    });

    res.status(201).json({
      message: 'Design version created successfully',
      version: designVersion
    });
  } catch (error) {
    next(error);
  }
});

// Create design review
router.post('/:id/review', async (req, res, next) => {
  try {
    const { reviewType, comments, rating } = req.body;

    // Check if design file exists and belongs to company
    const designFile = await prisma.designFile.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!designFile) {
      return res.status(404).json({
        error: 'Design file not found',
        message: 'Design file not found in your company'
      });
    }

    const designReview = await prisma.designReview.create({
      data: {
        projectId: designFile.projectId,
        designFileId: designFile.id,
        reviewerId: req.user.id,
        reviewType: reviewType || 'peer',
        comments: comments || '',
        rating: rating ? parseInt(rating) : null
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Design review created successfully',
      review: designReview
    });
  } catch (error) {
    next(error);
  }
});

// Update design review
router.put('/review/:reviewId', async (req, res, next) => {
  try {
    const { status, comments, rating } = req.body;

    const designReview = await prisma.designReview.findFirst({
      where: {
        id: req.params.reviewId,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!designReview) {
      return res.status(404).json({
        error: 'Design review not found',
        message: 'Design review not found in your company'
      });
    }

    const updatedReview = await prisma.designReview.update({
      where: { id: req.params.reviewId },
      data: {
        ...(status && { status }),
        ...(comments !== undefined && { comments }),
        ...(rating !== undefined && { rating }),
        ...(status === 'approved' || status === 'rejected' ? { completedAt: new Date() } : {})
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Design review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    next(error);
  }
});

// Delete design file
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if design file exists and belongs to company
    const designFile = await prisma.designFile.findFirst({
      where: {
        id: req.params.id,
        project: {
          companyId: req.user.companyId
        }
      }
    });

    if (!designFile) {
      return res.status(404).json({
        error: 'Design file not found',
        message: 'Design file not found in your company'
      });
    }

    // Delete file from disk
    try {
      await fs.unlink(designFile.filePath);
    } catch (error) {
      console.error('Failed to delete file from disk:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database (cascade will handle related records)
    await prisma.designFile.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Design file deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get design file statistics for project
router.get('/project/:projectId/stats', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to company
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

    const [fileCount, totalSize, designTypes, designStages, fileTypes] = await Promise.all([
      // Total file count
      prisma.designFile.count({ where: { projectId } }),
      // Total file size
      prisma.designFile.aggregate({
        where: { projectId },
        _sum: { fileSize: true }
      }),
      // Design types distribution
      prisma.designFile.groupBy({
        by: ['designType'],
        where: { projectId },
        _count: { designType: true }
      }),
      // Design stages distribution
      prisma.designFile.groupBy({
        by: ['designStage'],
        where: { projectId },
        _count: { designStage: true }
      }),
      // File types distribution
      prisma.designFile.groupBy({
        by: ['fileType'],
        where: { projectId },
        _count: { fileType: true }
      })
    ]);

    res.json({
      fileCount,
      totalSize: totalSize._sum.fileSize || 0,
      designTypes,
      designStages,
      fileTypes
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 