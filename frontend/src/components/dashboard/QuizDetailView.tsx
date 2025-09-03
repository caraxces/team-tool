'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getQuizById, deleteQuiz, duplicateQuiz } from '@/services/quiz.service';
import { Quiz, QuizQuestion } from '@/types/quiz.type';
import { Check, ChevronLeft, UserPlus, Pencil, FileText, BarChart2, MoreVertical, Trash2, Copy } from 'lucide-react';
import AssignQuizModal from './AssignQuizModal';
import { useAuth } from '@/context/AuthContext';
import QuizAssignmentsView from './QuizAssignmentsView';
import { ConfirmationModal } from './ConfirmationModal';

type DetailTab = 'content' | 'results';

interface QuizDetailViewProps {
    quizId: number;
    onBack: () => void;
    onQuizDeleted: () => void; // Add this to refresh the list after deletion
    onQuizDuplicated: (newQuiz: Quiz) => void;
}

const QuizDetailView = ({ quizId, onBack, onQuizDeleted, onQuizDuplicated }: QuizDetailViewProps) => {
    const { state: { user } } = useAuth();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<DetailTab>('content');
    const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    const managerRoles = [1, 2, 4];
    const canManage = user && managerRoles.includes(user.role_id);
    
    const fetchQuiz = async () => {
        if (!quizId) return;
        try {
            setIsLoading(true);
            const fetchedQuiz = await getQuizById(quizId);
            setQuiz(fetchedQuiz);
        } catch (error) {
            toast.error("Failed to fetch quiz details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
            setActionsMenuOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full text-gray-400">Loading details...</div>;
    }

    if (!quiz) {
        return <div className="flex items-center justify-center h-full text-gray-400">Could not load quiz details.</div>;
    }

    const handleDelete = async () => {
        if(!quiz) return;
        try {
            await deleteQuiz(quiz.id);
            toast.success("Quiz deleted successfully.");
            onQuizDeleted(); // Call parent to refresh list and go back
        } catch (error) {
            toast.error("Failed to delete quiz.");
        } finally {
            setConfirmDeleteOpen(false);
        }
    };

    const handleDuplicate = async () => {
        if (!quiz) return;
        try {
            const newQuiz = await duplicateQuiz(quiz.id);
            toast.success(`Quiz duplicated as "${newQuiz.title}"`);
            onQuizDuplicated(newQuiz);
        } catch (error) {
            toast.error("Failed to duplicate quiz.");
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
             {/* Header */}
            <div className="flex-shrink-0 mb-6">
                <button onClick={onBack} className="md:hidden flex items-center text-gray-300 mb-4">
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Back to Library
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
                        <p className="text-gray-400 mt-1">{quiz.description}</p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                           <button className="btn-primary" onClick={() => setIsAssignModalOpen(true)}><UserPlus size={16}/> Assign</button>
                           
                           {/* Actions Dropdown */}
                           <div className="relative" ref={actionsMenuRef}>
                               <button onClick={() => setActionsMenuOpen(prev => !prev)} className="btn-secondary p-2">
                                   <MoreVertical size={16}/>
                               </button>
                               {isActionsMenuOpen && (
                                   <div className="absolute right-0 mt-2 w-48 bg-dark-blue border border-white/20 rounded-lg shadow-lg z-10">
                                       <ul className="py-1 text-white">
                                           <li className="px-4 py-2 hover:bg-white/10 cursor-pointer flex items-center gap-2"><Pencil size={16}/> Edit Content</li>
                                           <li onClick={handleDuplicate} className="px-4 py-2 hover:bg-white/10 cursor-pointer flex items-center gap-2"><Copy size={16}/> Duplicate</li>
                                           <li onClick={() => {setConfirmDeleteOpen(true); setActionsMenuOpen(false);}} className="px-4 py-2 hover:bg-white/10 cursor-pointer text-red-400 flex items-center gap-2"><Trash2 size={16}/> Delete Quiz</li>
                                       </ul>
                                   </div>
                               )}
                           </div>
                       </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-white/10 mb-6">
                <nav className="flex space-x-4">
                    <TabButton icon={FileText} label="Content" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                    {canManage && <TabButton icon={BarChart2} label="Results" isActive={activeTab === 'results'} onClick={() => setActiveTab('results')} />}
                </nav>
            </div>


            {/* Content Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-4">
               {activeTab === 'content' && (
                    <div className="space-y-6">
                        {quiz.questions?.map((question, index) => (
                            <QuestionDisplay key={question.id} question={question} index={index} />
                        ))}
                    </div>
               )}
               {activeTab === 'results' && canManage && (
                    <QuizAssignmentsView quizId={quiz.id} />
               )}
            </div>

            {isAssignModalOpen && canManage && (
                <AssignQuizModal 
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    quiz={quiz}
                    onAssigned={() => {
                        // When assignments are made, switch to the results tab
                        setActiveTab('results');
                    }}
                />
            )}
            
            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Quiz"
                message={`Are you sure you want to delete the quiz "${quiz?.title}"? This action cannot be undone.`}
            />
        </div>
    );
};

const TabButton = ({ icon: Icon, label, isActive, onClick }: { icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${isActive ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
        <Icon size={16} />
        {label}
    </button>
);


const QuestionDisplay = ({ question, index }: { question: QuizQuestion, index: number }) => {
    return (
        <div className="bg-black/20 p-4 rounded-lg">
            <p className="font-bold text-gray-300 mb-3">{index + 1}. {question.question_text}</p>
            <ul className="space-y-2">
                {question.options.map(option => (
                    <li key={option.id} className={`flex items-center gap-3 p-2 rounded-md text-sm ${option.is_correct ? 'bg-green-500/20 text-green-300' : 'text-gray-400'}`}>
                        {option.is_correct && <Check size={16} />}
                        <span>{option.option_text}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default QuizDetailView; 