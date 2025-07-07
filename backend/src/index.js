const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const workUnitRoutes = require('./routes/workUnits');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const simulationRoutes = require('./routes/simulation');
const cadRoutes = require('./routes/cad');
const bomRoutes = require('./routes/bom');
const cadSoftwareRoutes = require('./routes/cad-software');
const manufacturingRoutes = require('./routes/manufacturing');
const analyticsRoutes = require('./routes/analytics');

const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/companies', authenticateToken, companyRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/work-units', authenticateToken, workUnitRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/simulation', authenticateToken, simulationRoutes);
app.use('/api/cad', authenticateToken, cadRoutes);
app.use('/api/bom', authenticateToken, bomRoutes);
app.use('/api/cad-software', authenticateToken, cadSoftwareRoutes);
app.use('/api/manufacturing', authenticateToken, manufacturingRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_project', (data) => {
    const { projectId } = data;
    socket.join(`project_${projectId}`);
    console.log(`User joined project: ${projectId}`);
  });

  socket.on('leave_project', (data) => {
    const { projectId } = data;
    socket.leave(`project_${projectId}`);
    console.log(`User left project: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 NitroPlanner API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

module.exports = { app, io }; 