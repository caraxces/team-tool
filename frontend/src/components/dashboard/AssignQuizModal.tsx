'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user.type';
import { Quiz } from '@/types/quiz.type';
import { getAllUsers } from '@/services/user.service';
import { assignQuiz } from '@/services/quiz.service';
import toast from 'react-hot-toast';
import { X, Calendar as CalendarIcon, UserPlus } from 'lucide-react';

interface AssignQuizModalProps {
    isOpen: boolean;
    onClose: () => void;
    quiz: Quiz;
    onAssigned: () => void;
}

const AssignQuizModal = ({ isOpen, onClose, quiz, onAssigned }: AssignQuizModalProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchUsers = async () => {
                try {
                    const fetchedUsers = await getAllUsers();
                    setUsers(fetchedUsers);
                } catch (error) {
                    toast.error("Failed to fetch users.");
                }
            };
            fetchUsers();
            // Reset state on open
            setSelectedUserIds([]);
            setDueDate('');
            setSearchTerm('');
        }
    }, [isOpen]);
    
    const handleAssign = async () => {
        if (selectedUserIds.length === 0) {
            toast.error("Please select at least one user.");
            return;
        }
        setIsLoading(true);
        try {
            const result = await assignQuiz(quiz.id, selectedUserIds, dueDate || undefined);
            toast.success(result.message || "Quiz assigned successfully!");
            onAssigned();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to assign quiz.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };
    
    const filteredUsers = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-dark-blue border border-white/20 rounded-2xl shadow-lg w-full max-w-lg flex flex-col h-auto max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus size={20} /> Assign "{quiz.title}"
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
                </div>
                
                <div className="p-6 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                    {/* Search and Due Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-glass"
                        />
                         <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input-glass"
                            min={new Date().toISOString().split('T')[0]} // Prevent choosing past dates
                        />
                    </div>

                    {/* User List */}
                    <div className="border border-white/10 rounded-lg max-h-64 overflow-y-auto custom-scrollbar">
                        <ul className="divide-y divide-white/10">
                            {filteredUsers.map(user => (
                                <li key={user.id} onClick={() => toggleUserSelection(user.id)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5">
                                    <div>
                                        <p className="font-semibold text-white">{user.fullName}</p>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        readOnly
                                        className="form-checkbox h-5 w-5 bg-transparent border-gray-500 rounded text-cyan-400 focus:ring-cyan-500"
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end gap-4 p-4 border-t border-white/10">
                    <button onClick={onClose} className="btn-secondary" disabled={isLoading}>Cancel</button>
                    <button onClick={handleAssign} className="btn-primary" disabled={isLoading || selectedUserIds.length === 0}>
                        {isLoading ? 'Assigning...' : `Assign to ${selectedUserIds.length} User(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignQuizModal; 