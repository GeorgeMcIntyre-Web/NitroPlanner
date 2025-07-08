import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient, User, Company } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
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
      res.status(403).json({ error: 'User not found or inactive' });
      return;
    }

    if (!user.company?.isActive) {
      res.status(403).json({ error: 'Company account is inactive' });
      return;
    }

    // Add user and company info to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      department: user.department,
      companyId: user.companyId
    };
    (req as any).company = user.company;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!(req as any).user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes((req as any).user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: (req as any).user.role
      });
      return;
    }
    next();
  };
};

export const authorizeCompanyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const companyUsers = await prisma.user.findMany({
      where: { companyId: (req as any).user.companyId },
      orderBy: { createdAt: 'asc' }
    });
    const isAdmin = companyUsers[0]?.id === (req as any).user.id;
    if (!isAdmin) {
      res.status(403).json({ error: 'Company admin access required' });
      return;
    }
    next();
  } catch (error) {
    console.error('Company admin authorization error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

export const checkResourceOwnership = (resourceType: 'project' | 'workUnit' | 'task') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = req.params.id || req.params.projectId || req.params.workUnitId || req.params.taskId;
      if (!resourceId) {
        next();
        return;
      }
      let resource: any;
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
              project: { select: { companyId: true } },
              createdById: true
            }
          });
          break;
        case 'task':
          resource = await prisma.task.findUnique({
            where: { id: resourceId },
            select: {
              project: { select: { companyId: true } },
              createdById: true
            }
          });
          break;
        default:
          next();
          return;
      }
      if (!resource) {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }
      const resourceCompanyId = resource.companyId || resource.project?.companyId;
      if (resourceCompanyId !== (req as any).user.companyId) {
        res.status(403).json({ error: 'Access denied to this resource' });
        return;
      }
      const isCreator = resource.createdById === (req as any).user.id;
      const isAdmin = (req as any).user.role === 'project_manager' || (req as any).user.role === 'admin';
      if (!isCreator && !isAdmin) {
        res.status(403).json({ error: 'Insufficient permissions for this resource' });
        return;
      }
      next();
    } catch (error) {
      res.status(500).json({ error: 'Resource ownership check failed' });
    }
  };
}; 