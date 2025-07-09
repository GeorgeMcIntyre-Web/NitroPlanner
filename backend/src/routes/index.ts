import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import projectRoutes from './projects';
import taskRoutes from './tasks';
import workUnitRoutes from './workUnits';
import analyticsRoutes from './analytics';
import templatesRoutes from './templates';
import importExportRoutes from './import-export';
import digitalTwinRoutes from './digital-twin';
// import collaborationRoutes from './collaboration'; // Temporarily commented out due to TypeScript errors

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/work-units', workUnitRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/templates', templatesRoutes);
router.use('/import-export', importExportRoutes);
router.use('/digital-twin', digitalTwinRoutes);
// router.use('/collaboration', collaborationRoutes); // Temporarily commented out due to TypeScript errors

export default router; 