export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'single-choice' | 'multiple-choice';
  options: QuestionOption[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  questions?: QuizQuestion[];
}

export interface QuizAssignment {
    id: number;
    quiz_id: number;
    assignee_id: number;
    assigned_by: number;
    status: 'pending' | 'in_progress' | 'completed';
    score: number | null;
    assigned_at: string;
    completed_at: string | null;
    // Optional hydrated data
    quiz_title?: string;
    assignee_name?: string;
    assigned_by_name?: string;
}

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