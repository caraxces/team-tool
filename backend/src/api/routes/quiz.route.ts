import express from 'express';
import * as quizController from '../controllers/quiz.controller';
import { protect } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';

const router = express.Router();

// Define allowed roles for management actions
const quizManagers = [1, 2, 4];

// Get all quizzes (lightweight) - Accessible by all authenticated users
// The service layer will later filter based on role.
router.get('/', protect, quizController.handleGetAllQuizzes);

// Get the current user's assigned quizzes
router.get('/assignments/my', protect, quizController.handleGetMyAssignments);

// Get a single quiz by ID with full details
router.get('/:id', protect, quizController.handleGetQuizById);

// Get all assignments for a specific quiz (for managers)
router.get('/:id/assignments', protect, checkRole(quizManagers), quizController.handleGetQuizAssignments);

// Create a new quiz - Restricted to managers
router.post('/', protect, checkRole(quizManagers), quizController.handleCreateQuiz);

// Assign a quiz to users - Restricted to managers
router.post('/:id/assign', protect, checkRole(quizManagers), quizController.handleAssignQuiz);

// Submit a quiz assignment
router.post('/assignments/:id/submit', protect, quizController.handleSubmitQuiz);

// Delete a quiz - Restricted to managers
router.delete('/:id', protect, checkRole(quizManagers), quizController.handleDeleteQuiz);
router.post('/:id/duplicate', protect, checkRole(quizManagers), quizController.handleDuplicateQuiz);


export default router; 