'use client';

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { FileText, PlusCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getQuizzes } from '@/services/quiz.service';
import { Quiz } from '@/types/quiz.type';
import CreateQuizModal from './CreateQuizModal';
import QuizDetailView from './QuizDetailView';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const QuizManagementView = () => {
    const { state: { user } } = useAuth(); // Get user from context
    const [quizzes, setQuizzes] = useState<Omit<Quiz, 'questions'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const managerRoles = [1, 2, 4];
    const canManage = user && managerRoles.includes(user.role_id);

    const fetchQuizzes = async () => {
        try {
            setIsLoading(true);
            const fetchedQuizzes = await getQuizzes();
            setQuizzes(fetchedQuizzes);
        } catch (error) {
            toast.error("Failed to fetch quizzes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleQuizCreated = (newQuiz: Quiz) => {
        setQuizzes(prev => [newQuiz, ...prev]);
        setSelectedQuiz(newQuiz);
    }

    const handleSelectQuiz = (quiz: Omit<Quiz, 'questions'>) => {
        setSelectedQuiz(quiz);
    };

    const handleQuizDeleted = () => {
        setSelectedQuiz(null); // Deselect the deleted quiz
        fetchQuizzes(); // Refresh the list from the server
    }

    const handleQuizDuplicated = (newQuiz: Quiz) => {
        fetchQuizzes(); // Refresh the list
        setSelectedQuiz(newQuiz); // Select the new duplicated quiz
    }

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="text-center p-10">Loading Quizzes...</div>;
    }

    return (
        <div className="flex flex-row w-full h-full gap-6">
            {/* Left Panel: Quiz List */}
            <div className="w-full md:w-1/3 flex-shrink-0 bg-white/5 rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Quiz Library</h1>
                        <p className="text-gray-400">{quizzes.length} quizzes available</p>
                    </div>
                    {canManage && (
                        <button onClick={() => setCreateModalOpen(true)} className="btn-primary">
                            <PlusCircle size={16}/> Create Quiz
                        </button>
                    )}
                </div>
                 {/* Search Bar */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search quizzes..."
                        className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                {/* Quiz List */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {isLoading ? (
                        <div className="text-center text-gray-400">Loading quizzes...</div>
                    ) : (
                        <ul className="space-y-2">
                            {filteredQuizzes.map(quiz => (
                                <li key={quiz.id}>
                                    <button 
                                        onClick={() => handleSelectQuiz(quiz)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedQuiz?.id === quiz.id ? 'bg-cyan-500/20' : 'hover:bg-white/10'}`}
                                    >
                                        <p className="font-semibold text-white">{quiz.title}</p>
                                        <p className="text-sm text-gray-400">
                                            {quiz.question_count} questions - Created on {formatDate(quiz.created_at)}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

             {/* Right Panel: Selected Quiz Details */}
            <div className={`hidden md:flex md:w-2/3 flex-col bg-white/5 rounded-xl p-6 ${selectedQuiz ? '' : 'justify-center items-center text-gray-500'}`}>
                {selectedQuiz ? (
                    <QuizDetailView 
                        quizId={selectedQuiz.id} 
                        onBack={() => setSelectedQuiz(null)} 
                        onQuizDeleted={handleQuizDeleted}
                        onQuizDuplicated={handleQuizDuplicated}
                    />
                ) : (
                    <>
                        <FileText className="h-16 w-16 mb-4"/>
                        <h2 className="text-xl font-bold">Select a Quiz</h2>
                        <p>Choose a quiz from the list to see its details.</p>
                    </>
                )}
            </div>

            {isCreateModalOpen && canManage && (
                <CreateQuizModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onCreated={(newQuiz) => {
                        setCreateModalOpen(false);
                        handleQuizCreated(newQuiz);
                    }}
                />
            )}
        </div>
    );
}

export default QuizManagementView; 