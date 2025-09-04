import pool from '../../config/database';
import { RowDataPacket } from 'mysql2';
import { Quiz, QuizQuestion, QuestionOption, CreateQuizPayload, AssignQuizPayload, SubmitQuizPayload } from '../../types/quiz.type';
import { createQuizAssignedNotification } from './notification.service';

/**
 * Creates a new quiz, including its questions and options, within a transaction.
 */
export const createQuiz = async (payload: CreateQuizPayload, createdBy: number): Promise<Quiz> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert the main quiz entry
        const [quizResult] = await connection.query<any>(
            'INSERT INTO quizzes (title, description, created_by) VALUES (?, ?, ?)',
            [payload.title, payload.description || null, createdBy]
        );
        const quizId = quizResult.insertId;

        // 2. Loop through and insert questions and their options
        for (const question of payload.questions) {
            const [questionResult] = await connection.query<any>(
                'INSERT INTO quiz_questions (quiz_id, question_text, question_type) VALUES (?, ?, ?)',
                [quizId, question.question_text, question.question_type]
            );
            const questionId = questionResult.insertId;

            if (question.options && question.options.length > 0) {
                const optionsValues = question.options.map(opt => [questionId, opt.option_text, opt.is_correct]);
                await connection.query(
                    'INSERT INTO question_options (question_id, option_text, is_correct) VALUES ?',
                    [optionsValues]
                );
            }
        }

        await connection.commit();

        // Fetch and return the newly created quiz
        const newQuiz = await getQuizById(quizId);
        if (!newQuiz) {
            throw new Error('Failed to fetch newly created quiz.');
        }
        return newQuiz;

    } catch (error) {
        await connection.rollback();
        console.error('Error in createQuiz service:', error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Fetches a single quiz with all its questions and options.
 */
export const getQuizById = async (quizId: number): Promise<Quiz | null> => {
    // 1. Get the main quiz data
    const [quizRows] = await pool.query<RowDataPacket[]>('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (quizRows.length === 0) return null;

    const quizData = quizRows[0] as Quiz;

    // 2. Get all questions for this quiz
    const [questionRows] = await pool.query<RowDataPacket[]>('SELECT * FROM quiz_questions WHERE quiz_id = ?', [quizId]);
    
    // 3. Get all options for all questions in this quiz
    const questionIds = questionRows.map(q => q.id);
    let options: QuestionOption[] = [];
    if (questionIds.length > 0) {
        const [optionRows] = await pool.query<RowDataPacket[]>('SELECT * FROM question_options WHERE question_id IN (?)', [questionIds]);
        options = optionRows as QuestionOption[];
    }
    
    // 4. Map options back to their respective questions
    const questions: QuizQuestion[] = questionRows.map((q: RowDataPacket) => {
        return {
            id: q.id,
            quiz_id: q.quiz_id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: options.filter(opt => opt.question_id === q.id),
            created_at: q.created_at,
            updated_at: q.updated_at,
        };
    });

    return { ...quizData, questions };
};

/**
 * Fetches all quizzes without their detailed questions/options for a lightweight list view.
 */
export const getAllQuizzes = async (): Promise<Omit<Quiz, 'questions'>[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
            q.id, 
            q.title, 
            q.description, 
            q.created_at,
            (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
        FROM quizzes q
        ORDER BY q.created_at DESC
    `);
    return rows as Omit<Quiz, 'questions'>[];
};


/**
 * Assigns a quiz to multiple users.
 * It ignores assignments that already exist (user already assigned to this quiz).
 */
export const assignQuizToUsers = async (
    quizId: number,
    payload: AssignQuizPayload,
    assignedById: number
): Promise<{ success: boolean; message: string }> => {
    const { userIds, dueDate } = payload;

    if (!userIds || userIds.length === 0) {
        return { success: false, message: 'No users selected to assign the quiz.' };
    }

    const assignments = userIds.map((userId: number) => [
        quizId,
        userId,
        assignedById,
        dueDate ? new Date(dueDate) : null
    ]);

    try {
        const [result] = await pool.query<any>(
            // Using INSERT IGNORE to prevent errors if an assignment already exists
            // due to the UNIQUE constraint on (quiz_id, user_id).
            'INSERT IGNORE INTO quiz_assignments (quiz_id, user_id, assigned_by_id, due_date) VALUES ?',
            [assignments]
        );

        // Create notifications for new assignments
        if (result.affectedRows > 0) {
            try {
                // Get quiz title for notification
                const [quizRows] = await pool.query<RowDataPacket[]>(
                    'SELECT title FROM quizzes WHERE id = ?',
                    [quizId]
                );
                
                if (quizRows.length > 0) {
                    const quizTitle = quizRows[0].title;
                    await createQuizAssignedNotification(assignedById, userIds, quizId, quizTitle);
                }
            } catch (notificationError) {
                console.error('Failed to create quiz assignment notification:', notificationError);
            }
        }

        return {
            success: true,
            message: `Quiz assigned to ${result.affectedRows} new user(s).`
        };
    } catch (error) {
        console.error('Error in assignQuizToUsers service:', error);
        throw new Error('Failed to assign quiz.');
    }
};


/**
 * Fetches all quiz assignments for a specific user.
 */
export const getAssignmentsForUser = async (userId: number): Promise<any[]> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                qa.id AS assignment_id,
                qa.status,
                qa.score,
                qa.completed_at,
                qa.due_date,
                q.id AS quiz_id,
                q.title AS quiz_title,
                q.description AS quiz_description,
                (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
            FROM quiz_assignments qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.user_id = ?
            ORDER BY qa.created_at DESC
        `, [userId]);
        return rows;
    } catch (error) {
        console.error('Error in getAssignmentsForUser service:', error);
        throw new Error('Failed to fetch user assignments.');
    }
};


/**
 * Fetches all assignments for a specific quiz, including user details.
 */
export const getAssignmentsForQuiz = async (quizId: number): Promise<any[]> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                qa.id AS assignment_id,
                qa.status,
                qa.score,
                qa.completed_at,
                qa.due_date,
                u.id AS user_id,
                u.full_name AS user_fullName,
                u.email AS user_email
            FROM quiz_assignments qa
            JOIN users u ON qa.user_id = u.id
            WHERE qa.quiz_id = ?
            ORDER BY u.full_name
        `, [quizId]);
        return rows;
    } catch (error) {
        console.error('Error in getAssignmentsForQuiz service:', error);
        throw new Error('Failed to fetch quiz assignments.');
    }
};


/**
 * Processes a user's submission for a quiz assignment.
 * Calculates the score and updates the assignment record.
 */
export const submitQuizAnswers = async (
    assignmentId: number,
    userId: number,
    answers: SubmitQuizPayload['answers']
): Promise<{ score: number; message: string }> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verify the assignment exists and belongs to the user
        const [assignmentRows] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM quiz_assignments WHERE id = ? AND user_id = ? AND status != "completed"',
            [assignmentId, userId]
        );

        if (assignmentRows.length === 0) {
            throw new Error('Assignment not found, not yours, or already completed.');
        }
        const assignment = assignmentRows[0];

        // 2. Prepare user answers for insertion
        const userAnswersToInsert = Object.entries(answers).flatMap(([questionId, optionIds]) => {
            // Assuming single choice, so optionIds is an array with one element
            const selectedOptionId = optionIds[0];
            if (selectedOptionId === undefined) {
                return []; // Skip if no answer for a question
            }
            return [[
                assignmentId,
                parseInt(questionId, 10),
                selectedOptionId
            ]];
        });

        // 3. Insert all user answers into the new table
        if (userAnswersToInsert.length > 0) {
            await connection.query(
                'INSERT INTO user_quiz_answers (assignment_id, question_id, selected_option_id) VALUES ?',
                [userAnswersToInsert]
            );
        }

        // 4. Fetch all correct answers for the entire quiz
        const [correctOptions] = await connection.query<RowDataPacket[]>(
            `SELECT q.id as question_id, o.id as option_id
             FROM quiz_questions q
             JOIN question_options o ON q.id = o.question_id
             WHERE q.quiz_id = ? AND o.is_correct = 1`,
            [assignment.quiz_id]
        );

        const correctAnswers: Record<number, number[]> = {};
        correctOptions.forEach(row => {
            if (!correctAnswers[row.question_id]) {
                correctAnswers[row.question_id] = [];
            }
            correctAnswers[row.question_id].push(row.option_id);
        });

        // 5. Calculate score
        let correctCount = 0;
        const totalQuestions = Object.keys(correctAnswers).length;

        for (const questionId in correctAnswers) {
            const userAns = answers[questionId]?.sort() || [];
            const correctAns = correctAnswers[questionId].sort();

            // Compare arrays for equality
            if (JSON.stringify(userAns) === JSON.stringify(correctAns)) {
                correctCount++;
            }
        }
        
        const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
        const finalScore = parseFloat(score.toFixed(2));

        // 6. Update the assignment record
        await connection.query(
            'UPDATE quiz_assignments SET status = "completed", score = ?, completed_at = NOW() WHERE id = ?',
            [finalScore, assignmentId]
        );

        await connection.commit();

        return {
            score: finalScore,
            message: 'Quiz submitted successfully!'
        };

    } catch (error) {
        await connection.rollback();
        console.error('Error in submitQuizAnswers service:', error);
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Deletes a quiz from the database.
 * Cascading deletes will handle related questions, options, and assignments.
 */
export const deleteQuiz = async (quizId: number): Promise<void> => {
    try {
        const [result] = await pool.query<any>('DELETE FROM quizzes WHERE id = ?', [quizId]);
        if (result.affectedRows === 0) {
            throw new Error('Quiz not found or already deleted.');
        }
    } catch (error) {
        console.error('Error in deleteQuiz service:', error);
        throw new Error('Failed to delete quiz.');
    }
};

/**
 * Duplicates an existing quiz.
 */
export const duplicateQuiz = async (originalQuizId: number, userId: number): Promise<Quiz> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get the original quiz with its full structure
        const originalQuiz = await getQuizById(originalQuizId);
        if (!originalQuiz) {
            throw new Error('Original quiz not found.');
        }

        // 2. Create the new quiz entry
        const newQuizTitle = `${originalQuiz.title} (Copy)`;
        const [quizResult] = await connection.query<any>(
            'INSERT INTO quizzes (title, description, created_by) VALUES (?, ?, ?)',
            [newQuizTitle, originalQuiz.description, userId]
        );
        const newQuizId = quizResult.insertId;

        // 3. Duplicate questions and options
        for (const question of originalQuiz.questions) {
            const [questionResult] = await connection.query<any>(
                'INSERT INTO quiz_questions (quiz_id, question_text, question_type) VALUES (?, ?, ?)',
                [newQuizId, question.question_text, question.question_type]
            );
            const newQuestionId = questionResult.insertId;

            if (question.options && question.options.length > 0) {
                const optionsValues = question.options.map(opt => [newQuestionId, opt.option_text, opt.is_correct]);
                await connection.query(
                    'INSERT INTO question_options (question_id, option_text, is_correct) VALUES ?',
                    [optionsValues]
                );
            }
        }

        await connection.commit();

        // 4. Fetch and return the full new quiz
        const newQuiz = await getQuizById(newQuizId);
        if (!newQuiz) {
            throw new Error('Failed to fetch the duplicated quiz.');
        }
        return newQuiz;

    } catch (error) {
        await connection.rollback();
        console.error('Error in duplicateQuiz service:', error);
        throw error; // Rethrow to be caught by controller
    } finally {
        connection.release();
    }
};


// NOTE: Update and Delete functions will be added in subsequent steps. 