import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { getConnection } from '../backend/src/config/database';
import apiRouter from '../backend/src/api/routes';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static files
app.use('/public', express.static(path.join(__dirname, '../backend/public')));

// Initialize database connection
let dbInitialized = false;

const initializeDatabase = async () => {
  if (!dbInitialized) {
    try {
      await getConnection();
      console.log('[database]: Successfully connected to the database.');
      dbInitialized = true;
    } catch (err) {
      console.error('[database]: Connection failed:', err);
      throw err;
    }
  }
};

// Routes
app.use('/api', async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
}, apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app; 