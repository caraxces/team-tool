'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getQuizAssignments } from '@/services/quiz.service';
import { User, CheckCircle, Clock } from 'lucide-react';

// Define types for clarity
interface QuizAssignmentResult {
    assignment_id: number;
    status: 'pending' | 'in-progress' | 'completed';
    score: number | null;
    completed_at: string | null;
    due_date: string | null;
    user_id: number;
    user_fullName: string;
    user_email: string;
}

interface QuizAssignmentsViewProps {
    quizId: number;
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const StatusBadge = ({ status }: { status: QuizAssignmentResult['status'] }) => {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5';
    if (status === 'completed') {
        return <span className={`${baseClasses} bg-green-500/20 text-green-300`}><CheckCircle size={14}/> Completed</span>;
    }
    if (status === 'in-progress') {
        return <span className={`${baseClasses} bg-yellow-500/20 text-yellow-300`}><Clock size={14}/> In Progress</span>;
    }
    return <span className={`${baseClasses} bg-gray-500/20 text-gray-300`}><Clock size={14}/> Pending</span>;
};


const QuizAssignmentsView = ({ quizId }: QuizAssignmentsViewProps) => {
    const [assignments, setAssignments] = useState<QuizAssignmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!quizId) return;

        const fetchAssignments = async () => {
            try {
                setIsLoading(true);
                const data = await getQuizAssignments(quizId);
                setAssignments(data);
            } catch (error) {
                toast.error("Failed to load assignment results.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssignments();
    }, [quizId]);

    if (isLoading) {
        return <div className="text-center text-gray-400 py-10">Loading results...</div>;
    }

    if (assignments.length === 0) {
        return (
            <div className="text-center py-16 bg-black/20 rounded-xl">
                <User size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-xl font-bold text-white">No Assignments Yet</h3>
                <p className="text-gray-400">This quiz has not been assigned to any users.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-white/5">
                        <tr>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Score</th>
                            <th scope="col" className="px-6 py-3">Completed At</th>
                            <th scope="col" className="px-6 py-3">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(item => (
                            <tr key={item.assignment_id} className="border-b border-white/10 hover:bg-white/5">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div className="font-semibold">{item.user_fullName}</div>
                                    <div className="text-xs text-gray-400">{item.user_email}</div>
                                </td>
                                <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                <td className="px-6 py-4 font-mono">{item.score !== null ? `${item.score}%` : 'N/A'}</td>
                                <td className="px-6 py-4 font-mono">{formatDate(item.completed_at)}</td>
                                <td className="px-6 py-4 font-mono">{formatDate(item.due_date)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuizAssignmentsView; 