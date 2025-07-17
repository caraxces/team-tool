'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getQuizById, submitQuiz } from '@/services/quiz.service';
import { Quiz, QuizQuestion, QuestionOption } from '@/types/quiz.type';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Define a type for the assignment data, assuming it's passed as a prop
interface Assignment {
    assignment_id: number;
    quiz_id: number;
    quiz_title: string;
}

interface TakeQuizViewProps {
    assignment: Assignment;
    onBack: () => void; // Function to go back to the assignments list
    onQuizComplete: () => void; // Function to refresh assignments list after completion
}

// Type for storing answers
type Answers = Record<number, number[]>; // question_id -> array of selected option_ids

const TakeQuizView: React.FC<TakeQuizViewProps> = ({ assignment, onBack, onQuizComplete }) => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [answers, setAnswers] = useState<Answers>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setIsLoading(true);
                const quizData = await getQuizById(assignment.quiz_id);
                setQuiz(quizData);
            } catch (error) {
                toast.error("Failed to load the quiz. Please try again.");
                onBack(); // Go back if quiz fails to load
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [assignment.quiz_id, onBack]);

    const handleAnswerChange = (questionId: number, optionId: number, questionType: 'single-choice' | 'multiple-choice') => {
        setAnswers(prev => {
            const newAnswers = { ...prev };
            const currentAnswers = newAnswers[questionId] || [];

            if (questionType === 'single-choice') {
                newAnswers[questionId] = [optionId];
            } else { // multiple-choice
                if (currentAnswers.includes(optionId)) {
                    // Deselect
                    newAnswers[questionId] = currentAnswers.filter(id => id !== optionId);
                } else {
                    // Select
                    newAnswers[questionId] = [...currentAnswers, optionId];
                }
            }
            return newAnswers;
        });
    };
    
    const handleSubmit = async () => {
        if (!quiz || !quiz.questions || Object.keys(answers).length !== quiz.questions.length) {
            toast.error("Please answer all questions before submitting.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const payload = {
                assignmentId: assignment.assignment_id,
                answers: answers,
            };
            const result = await submitQuiz(payload);
            toast.success(`Quiz submitted! Your score: ${result.score}%`, { duration: 5000 });
            onQuizComplete(); // Go back and refresh the list
        } catch (error) {
            toast.error("Failed to submit your answers. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) {
        return <div className="text-center p-10">Loading Quiz...</div>;
    }

    if (!quiz) {
        return <div className="text-center p-10">Quiz not found.</div>
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                <ArrowLeft size={18} />
                Back to My Assignments
            </button>

            <div className="bg-white/5 rounded-xl p-8">
                <h1 className="text-3xl font-bold text-white mb-2">{quiz.title}</h1>
                <p className="text-gray-400 mb-8">{quiz.description}</p>

                <div className="space-y-8">
                    {quiz && quiz.questions && quiz.questions.map((question, index) => (
                        <div key={question.id} className="border-t border-white/10 pt-6">
                            <p className="font-semibold text-lg text-white mb-4">
                                Question {index + 1}: {question.question_text}
                            </p>
                            <div className="space-y-3">
                                {question.options.map(option => (
                                    <label key={option.id} className="flex items-center gap-3 bg-white/5 p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-colors border-2 border-transparent has-[:checked]:border-cyan-500">
                                        <input
                                            type={question.question_type === 'single-choice' ? 'radio' : 'checkbox'}
                                            name={`question-${question.id}`}
                                            checked={(answers[question.id] || []).includes(option.id)}
                                            onChange={() => handleAnswerChange(question.id, option.id, question.question_type)}
                                            className="form-checkbox md:form-radio h-5 w-5 bg-transparent border-white/20 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        <span className="text-gray-200">{option.option_text}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex justify-end">
                     <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="w-full md:w-auto py-3 px-8 bg-green-600/30 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-lg border border-green-500/50 backdrop-blur-xl hover:bg-green-600/50 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                        {isSubmitting ? "Submitting..." : "Submit Quiz"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TakeQuizView; 