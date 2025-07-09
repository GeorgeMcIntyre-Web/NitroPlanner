console.log('🔥 BACKEND SERVER STARTED - THIS IS THE REAL ONE!');
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { usersRouter, projectsRouter, authRouter } from './routes';
import importExportRouter from './routes/import-export';
import analyticsRouter from './routes/analytics';
import digitalTwinRouter from './routes/digital-twin';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());

// Core routes
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
console.log('IMPORTING AUTH ROUTES');
app.use('/api/auth', authRouter);

// New feature routes
app.use('/api/import-export', importExportRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/digital-twin', digitalTwinRouter);

// Health check endpoint for test scripts and monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 