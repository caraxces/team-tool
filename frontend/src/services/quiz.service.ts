import api from './api';
import { Quiz, CreateQuizFormValues, QuizAssignment } from '../types/quiz.type';

/**
 * Fetches all quizzes for the management view.
 * @returns A list of quizzes without their questions.
 */
export const getQuizzes = async (): Promise<Quiz[]> => {
  const response = await api.get('/quizzes');
  return response.data; // Corrected: return data directly
};

/**
 * Fetches a single quiz with its full details (questions and options).
 * @param quizId The ID of the quiz to fetch.
 * @returns The detailed quiz object.
 */
export const getQuizById = async (quizId: number): Promise<Quiz> => {
  const response = await api.get(`/quizzes/${quizId}`);
  return response.data; // Corrected: return data directly
};

/**
 * Creates a new quiz.
 * @param payload The quiz data from the form.
 * @returns The newly created quiz object.
 */
export const createQuiz = async (payload: CreateQuizFormValues): Promise<Quiz> => {
  const response = await api.post('/quizzes', payload);
  return response.data; // Corrected: return data directly
};

export const assignQuiz = async (quizId: number, userIds: number[], dueDate?: string): Promise<any> => {
  try {
    const response = await api.post(`/quizzes/${quizId}/assign`, { userIds, dueDate });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to assign quiz');
    }
    throw error;
  }
};

export const getMyAssignments = async (): Promise<any[]> => {
    try {
        const response = await api.get('/quizzes/assignments/my');
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Failed to fetch assignments');
        }
        throw error;
    }
};

export const getQuizAssignments = async (quizId: number): Promise<QuizAssignment[]> => {
    try {
        const response = await api.get(`/quizzes/${quizId}/assignments`);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch assignments for quiz ${quizId}:`, error);
        throw error;
    }
};

export const deleteQuiz = async (quizId: number): Promise<void> => {
    try {
        await api.delete(`/quizzes/${quizId}`);
    } catch (error) {
        console.error(`Failed to delete quiz ${quizId}:`, error);
        throw error;
    }
};

export const duplicateQuiz = async (quizId: number): Promise<Quiz> => {
    try {
        const response = await api.post(`/quizzes/${quizId}/duplicate`);
        return response.data;
    } catch (error) {
        console.error(`Failed to duplicate quiz ${quizId}:`, error);
        throw error;
    }
};

export const submitQuiz = async (payload: { assignmentId: number; answers: Record<number, number[]> }): Promise<{ score: number; message: string }> => {
    try {
        const response = await api.post(`/quizzes/assignments/${payload.assignmentId}/submit`, { answers: payload.answers });
        return response.data;
    } catch (error) {
        console.error('Failed to submit quiz:', error);
        throw error;
    }
};

// --- Assignment related services will be added later --- 