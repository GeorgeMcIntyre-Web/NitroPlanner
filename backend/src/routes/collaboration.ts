import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    department: string;
    companyId: string;
  };
}

// Get io instance
let io: any;
try {
  const { io: ioInstance } = require('../index');
  io = ioInstance;
} catch (error) {
  console.warn('Socket.io not available for collaboration features');
  io = {
    to: () => ({
      emit: () => {}
    })
  };
}

// Get comments for a task or project
router.get('/comments/:type/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where = type === 'task' 
      ? { taskId: id || null }
      : { projectId: id || null };
    
    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });
    
    const total = await prisma.comment.count({ where });
    
    res.json({
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a new comment
router.post('/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, taskId, projectId, parentId } = req.body;
    const userId = req.user?.id;
    
    if (!content || (!taskId && !projectId)) {
      res.status(400).json({ error: 'Content and taskId or projectId are required' });
      return;
    }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: taskId || null,
        projectId: projectId || null,
        userId: userId!,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    // Emit real-time update
    const room = taskId ? `task_${taskId}` : `project_${projectId}`;
    io.to(room).emit('comment_added', comment);
    
    res.json(comment);
    return;
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
    return;
  }
});

// Update a comment
router.put('/comments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;
    
    if (!id) {
      res.status(400).json({ error: 'Comment ID is required' });
      return;
    }
    
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { task: true, project: true }
    });
    
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    
    if (comment.userId !== userId) {
      res.status(403).json({ error: 'Not authorized to edit this comment' });
      return;
    }
    
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    // Emit real-time update
    const room = comment.taskId ? `task_${comment.taskId}` : `project_${comment.projectId}`;
    io.to(room).emit('comment_updated', updatedComment);
    
    res.json(updatedComment);
    return;
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
    return;
  }
});

// Delete a comment
router.delete('/comments/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!id) {
      res.status(400).json({ error: 'Comment ID is required' });
      return;
    }
    
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { task: true, project: true }
    });
    
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }
    
    if (comment.userId !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this comment' });
      return;
    }
    
    await prisma.comment.delete({
      where: { id }
    });
    
    // Emit real-time update
    const room = comment.taskId ? `task_${comment.taskId}` : `project_${comment.projectId}`;
    io.to(room).emit('comment_deleted', { id });
    
    res.json({ message: 'Comment deleted successfully' });
    return;
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
    return;
  }
});

// Start collaboration session
router.post('/sessions/start', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.body;
    const userId = req.user?.id;
    
    // End any existing active session for this user
    await prisma.collaborationSession.updateMany({
      where: {
        userId: userId!,
        projectId,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });
    
    // Create new session
    const session = await prisma.collaborationSession.create({
      data: {
        projectId,
        userId: userId!
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    // Emit real-time update
    io.to(`project_${projectId}`).emit('user_joined_session', session);
    
    res.json(session);
  } catch (error) {
    console.error('Error starting collaboration session:', error);
    res.status(500).json({ error: 'Failed to start collaboration session' });
  }
});

// End collaboration session
router.post('/sessions/end', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.body;
    const userId = req.user?.id;
    
    const session = await prisma.collaborationSession.updateMany({
      where: {
        userId: userId!,
        projectId,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });
    
    // Emit real-time update
    io.to(`project_${projectId}`).emit('user_left_session', { userId, projectId });
    
    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('Error ending collaboration session:', error);
    res.status(500).json({ error: 'Failed to end collaboration session' });
  }
});

// Get active collaboration sessions for a project
router.get('/sessions/active/:projectId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      res.status(400).json({ error: 'Project ID is required' });
      return;
    }
    
    const sessions = await prisma.collaborationSession.findMany({
      where: {
        projectId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { startedAt: 'asc' }
    });
    
    res.json(sessions);
    return;
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
    return;
  }
});

// Record live edit
router.post('/live-edit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId, field, oldValue, newValue } = req.body;
    const userId = req.user?.id;
    
    const liveEdit = await prisma.liveEdit.create({
      data: {
        taskId,
        userId: userId!,
        field,
        oldValue,
        newValue
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    // Emit real-time update
    io.to(`task_${taskId}`).emit('live_edit_recorded', liveEdit);
    
    res.json(liveEdit);
  } catch (error) {
    console.error('Error recording live edit:', error);
    res.status(500).json({ error: 'Failed to record live edit' });
  }
});

// Get live edit history for a task
router.get('/live-edit/:taskId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { limit = 50 } = req.query;
    
    if (!taskId) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }
    
    const liveEdits = await prisma.liveEdit.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit)
    });
    
    res.json(liveEdits);
    return;
  } catch (error) {
    console.error('Error fetching live edit history:', error);
    res.status(500).json({ error: 'Failed to fetch live edit history' });
    return;
  }
});

export default router; 