import express from 'express';
import bodyParser from 'body-parser';
import { usersRouter, projectsRouter } from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 