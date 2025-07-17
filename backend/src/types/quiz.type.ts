export interface Quiz {
    id: number;
    title: string;
    description: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
    questions: QuizQuestion[];
    question_count?: number; 
}

export interface QuizQuestion {
    id: number;
    quiz_id: number;
    question_text: string;
    question_type: 'single-choice' | 'multiple-choice';
    options: QuestionOption[];
    created_at: Date;
    updated_at: Date;
}

export interface QuestionOption {
    id: number;
    question_id: number;
    option_text: string;
    is_correct: boolean;
    created_at: Date;
    updated_at: Date;
}

// Payload for creating a new quiz
export interface CreateQuizPayload {
    title: string;
    description?: string;
    questions: {
        question_text: string;
        question_type: 'single-choice' | 'multiple-choice';
        options: {
            option_text: string;
            is_correct: boolean;
        }[];
    }[];
}


// Types for Quiz Assignment
export interface QuizAssignment {
    id: number;
    quiz_id: number;
    user_id: number;
    assigned_by_id: number | null;
    due_date: Date | null;
    status: 'pending' | 'in-progress' | 'completed';
    score: number | null;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export interface AssignQuizPayload {
    userIds: number[];
    dueDate?: string; // ISO 8601 date string from client
}

export interface SubmitQuizPayload {
    answers: Record<number, number[]>; // question_id -> array of selected option_ids
}

/**
 * Creates a new quiz, including its questions and options, within a transaction.
 */
// ... existing code ... 