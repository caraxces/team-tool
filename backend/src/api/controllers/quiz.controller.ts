import { Request, Response } from 'express';
import * as quizService from '../services/quiz.service';
import { CreateQuizPayload } from '../../types/quiz.type';

export const handleCreateQuiz = async (req: Request, res: Response) => {
    try {
        const payload: CreateQuizPayload = req.body;
        // @ts-ignore
        const userId = req.user.id;
        const newQuiz = await quizService.createQuiz(payload, userId);
        res.status(201).json(newQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Error creating quiz', error: (error as Error).message });
    }
};

export const handleGetAllQuizzes = async (req: Request, res: Response) => {
    try {
        const quizzes = await quizService.getAllQuizzes();
        res.status(200).json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error: (error as Error).message });
    }
};

export const handleGetQuizById = async (req: Request, res: Response) => {
    try {
        const quizId = parseInt(req.params.id, 10);
        const quiz = await quizService.getQuizById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz details', error: (error as Error).message });
    }
};

export const handleAssignQuiz = async (req: Request, res: Response) => {
    try {
        const quizId = parseInt(req.params.id, 10);
        // @ts-ignore
        const assignedById = req.user.id; 
        
        const result = await quizService.assignQuizToUsers(quizId, req.body, assignedById);
        
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error assigning quiz', error: (error as Error).message });
    }
};

export const handleGetMyAssignments = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const assignments = await quizService.getAssignmentsForUser(userId);
        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assignments', error: (error as Error).message });
    }
};

export const handleGetQuizAssignments = async (req: Request, res: Response) => {
    try {
        const quizId = parseInt(req.params.id, 10);
        const assignments = await quizService.getAssignmentsForQuiz(quizId);
        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz assignments', error: (error as Error).message });
    }
};

export const handleSubmitQuiz = async (req: Request, res: Response) => {
    try {
        const assignmentId = parseInt(req.params.id, 10);
        // @ts-ignore
        const userId = req.user.id;
        const { answers } = req.body;

        const result = await quizService.submitQuizAnswers(assignmentId, userId, answers);

        res.status(200).json(result);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not authorized')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error submitting quiz', error: (error as Error).message });
    }
};

export const handleDeleteQuiz = async (req: Request, res: Response) => {
    try {
        const quizId = parseInt(req.params.id, 10);
        await quizService.deleteQuiz(quizId);
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error: (error as Error).message });
    }
};

export const handleDuplicateQuiz = async (req: Request, res: Response) => {
    try {
        const quizId = parseInt(req.params.id, 10);
        // @ts-ignore
        const userId = req.user.id;
        const newQuiz = await quizService.duplicateQuiz(quizId, userId);
        res.status(201).json(newQuiz);
    } catch (error) {
        res.status(500).json({ message: 'Error duplicating quiz', error: (error as Error).message });
    }
}; 