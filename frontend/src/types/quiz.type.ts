// Matches the Quiz interface from the backend, but questions are optional for list view.
export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  question_count?: number; // From the lightweight GET /quizzes response
  questions?: QuizQuestion[]; // From the detailed GET /quizzes/:id response
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'single-choice' | 'multiple-choice';
  options: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

export interface QuizAssignment {
    assignment_id: number;
    status: 'pending' | 'in-progress' | 'completed';
    score: number | null;
    completed_at: string | null;
    due_date: string | null;
    user_id: number;
    user_fullName: string;
    user_email: string;
}

// Payload for creating a new quiz, used by the form
export interface CreateQuizFormValues {
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