const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// JWT Secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            isActive: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    if (!user.company.isActive) {
      return res.status(403).json({ error: 'Company account is inactive' });
    }

    // Add user and company info to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      department: user.department,
      companyId: user.companyId
    };
    req.company = user.company;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Company admin authorization
const authorizeCompanyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is company admin (you can add a field for this)
    // For now, we'll assume the first user in a company is the admin
    const companyUsers = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'asc' }
    });

    const isAdmin = companyUsers[0]?.id === req.user.id;
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Company admin access required' });
    }

    next();
  } catch (error) {
    console.error('Company admin authorization error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

// Resource ownership check
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.projectId || req.params.workUnitId || req.params.taskId;
      
      if (!resourceId) {
        return next();
      }

      let resource;
      
      switch (resourceType) {
        case 'project':
          resource = await prisma.project.findUnique({
            where: { id: resourceId },
            select: { companyId: true, createdById: true }
          });
          break;
        case 'workUnit':
          resource = await prisma.workUnit.findUnique({
            where: { id: resourceId },
            select: { 
              project: {
                select: { companyId: true }
              },
              createdById: true
            }
          });
          break;
        case 'task':
          resource = await prisma.task.findUnique({
            where: { id: resourceId },
            select: { 
              project: {
                select: { companyId: true }
              },
              createdById: true
            }
          });
          break;
        default:
          return next();
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check if user belongs to the same company
      const resourceCompanyId = resource.companyId || resource.project?.companyId;
      if (resourceCompanyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied to this resource' });
      }

      // Optional: Check if user is the creator or has admin role
      const isCreator = resource.createdById === req.user.id;
      const isAdmin = req.user.role === 'project_manager' || req.user.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({ error: 'Insufficient permissions for this resource' });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  authorizeRoles,
  authorizeCompanyAdmin,
  checkResourceOwnership
}; 