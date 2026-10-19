import cors from 'cors'; import express from 'express'; import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js'; import taskRoutes from './routes/taskRoutes.js'; import workspaceRoutes from './routes/workspaceRoutes.js'; import { errorHandler, notFound } from './middleware/errorHandler.js';
const app = express(); app.use(cors({ origin: process.env.CLIENT_URL, credentials: true })); app.use(express.json({ limit: '1mb' })); app.use(morgan('dev'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' })); app.use('/api/auth', authRoutes); app.use('/api/tasks', taskRoutes); app.use('/api/workspaces', workspaceRoutes); app.use(notFound); app.use(errorHandler); export default app;
