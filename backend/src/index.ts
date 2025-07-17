import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import path from 'path'; // Import path module
import { getConnection } from './config/database';
import apiRouter from './api/routes'; // Import the main API router
import teamRoutes from './api/routes/team.route';
import taskRoutes from './api/routes/task.route';
import projectRoutes from './api/routes/project.route';
import knowledgeRoutes from './api/routes/knowledge.route';
import quizRoutes from './api/routes/quiz.route';

const app: Express = express();
const port = process.env.PORT || 3001;

// Middlewares
// Use a more open CORS policy for debugging
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, '../public')));

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const connectToDatabaseWithRetry = async (retries = 5) => {
  while (retries > 0) {
    try {
      await getConnection();
      console.log('[database]: Successfully connected to the database.');
      return;
    } catch (err) {
      retries -= 1;
      console.error(`[database]: Connection failed. Retries left: ${retries}`, err);
      if (retries === 0) {
        throw new Error('Failed to connect to the database after multiple retries.');
      }
      // Wait for 5 seconds before trying again
      await sleep(5000);
    }
  }
};

const startServer = async () => {
  try {
    await connectToDatabaseWithRetry();

    app.use('/api', apiRouter);

    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('[server]: Could not start server.', error);
    process.exit(1);
  }
};

startServer(); 