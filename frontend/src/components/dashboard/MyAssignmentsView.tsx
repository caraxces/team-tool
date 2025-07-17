'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getMyAssignments } from '@/services/quiz.service';
import { CheckCircle, Clock, ListChecks } from 'lucide-react';
import TakeQuizView from './TakeQuizView'; // Import the new component

// Define a type for the assignment data
interface Assignment {
    assignment_id: number;
    status: 'pending' | 'in-progress' | 'completed';
    score: number | null;
    completed_at: string | null;
    due_date: string | null;
    quiz_id: number;
    quiz_title: string;
    quiz_description: string;
    question_count: number;
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const StatusBadge = ({ status }: { status: Assignment['status'] }) => {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
    if (status === 'completed') {
        return <span className={`${baseClasses} bg-green-500/20 text-green-300`}>Completed</span>;
    }
    if (status === 'in-progress') {
        return <span className={`${baseClasses} bg-yellow-500/20 text-yellow-300`}>In Progress</span>;
    }
    return <span className={`${baseClasses} bg-gray-500/20 text-gray-300`}>Pending</span>;
};

const MyAssignmentsView = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    const fetchAssignments = async () => {
        try {
            setIsLoading(true);
            const data = await getMyAssignments();
            setAssignments(data);
        } catch (error) {
            toast.error("Failed to fetch your assignments.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const handleQuizComplete = () => {
        setSelectedAssignment(null); // Go back to the list
        fetchAssignments(); // Refresh the list
    };

    if (isLoading) {
        return <div className="text-center text-gray-400 py-10">Loading your assignments...</div>;
    }

    // If an assignment is selected, render the quiz taking view
    if (selectedAssignment) {
        return <TakeQuizView 
                    assignment={selectedAssignment} 
                    onBack={() => setSelectedAssignment(null)}
                    onQuizComplete={handleQuizComplete}
                />;
    }

    return (
        <div className="w-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ListChecks />
                    My Quizzes
                </h1>
                <p className="text-gray-400 mt-1">Here are the quizzes assigned to you. Complete them before the due date!</p>
            </div>

            {assignments.length === 0 ? (
                 <div className="text-center py-16 bg-white/5 rounded-xl">
                    <p className="text-gray-400">You have no assigned quizzes at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(assignment => (
                        <div key={assignment.assignment_id} className="bg-white/5 p-5 rounded-lg border border-transparent hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{assignment.quiz_title}</h3>
                                <p className="text-sm text-gray-400 mb-4 h-10 overflow-hidden">{assignment.quiz_description}</p>
                                <div className="text-sm space-y-2 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-semibold">Status:</span>
                                        <StatusBadge status={assignment.status} />
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-semibold">Score:</span>
                                        <span className="font-mono">{assignment.score !== null ? `${assignment.score}%` : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-semibold">Due Date:</span>
                                        <span className="font-mono">{formatDate(assignment.due_date)}</span>
                                    </div>
                                </div>
                            </div>
                           <button 
                                onClick={() => setSelectedAssignment(assignment)}
                                className="w-full mt-4 py-3 bg-green-600/30 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-lg border border-green-500/50 backdrop-blur-xl hover:bg-green-600/50 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                                disabled={assignment.status === 'completed'}
                            >
                                {assignment.status === 'completed' ? 'View Results' : 'Start Quiz'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAssignmentsView; 