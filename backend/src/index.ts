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
// CORS: allow Vercel frontend and all *.vercel.app (production + previews)
const allowedOrigins = [
  'http://localhost:3000',
  'https://team-tool.vercel.app',
  'https://team-tool-bice.vercel.app',
  'https://team-tool-cdne8kbuy-larisatrucmt-gmailcoms-projects.vercel.app'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost')) return callback(null, true);
    if (origin.includes('.vercel.app')) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));
// Ensure OPTIONS (preflight) gets CORS headers even on 404
app.options('*', cors(corsOptions));
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