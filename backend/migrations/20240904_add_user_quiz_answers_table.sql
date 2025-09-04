-- =================================================================
-- Migration: Add user_quiz_answers table
-- =================================================================
-- Description: This migration creates a new table to store the specific
--              answers provided by a user for each question in a quiz assignment.
-- =================================================================

CREATE TABLE `user_quiz_answers` (
    `id` INTEGER AUTO_INCREMENT PRIMARY KEY,
    `assignment_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `selected_option_id` INTEGER NOT NULL,
    `answered_at` TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key to link the answer to a specific quiz assignment
    CONSTRAINT `fk_user_answer_assignment`
        FOREIGN KEY (`assignment_id`)
        REFERENCES `quiz_assignments`(`id`)
        ON DELETE CASCADE,
        
    -- Foreign key to link the answer to a specific question
    CONSTRAINT `fk_user_answer_question`
        FOREIGN KEY (`question_id`)
        REFERENCES `quiz_questions`(`id`)
        ON DELETE CASCADE,
        
    -- Foreign key to link the answer to a specific option
    CONSTRAINT `fk_user_answer_option`
        FOREIGN KEY (`selected_option_id`)
        REFERENCES `question_options`(`id`)
        ON DELETE CASCADE,
        
    -- An assignment can only have one answer per question
    UNIQUE `unique_assignment_question` (`assignment_id`, `question_id`)
) ENGINE='InnoDB' DEFAULT CHARSET='utf8mb4' COLLATE='utf8mb4_unicode_ci';
