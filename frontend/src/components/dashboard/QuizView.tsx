'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import QuizManagementView from './QuizManagementView';
import MyAssignmentsView from './MyAssignmentsView'; // This will be created next

const QuizView = () => {
    const { state, loading } = useAuth();
    const { user } = state;

    const managerRoles = [1, 2, 4];

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    if (!user) {
        return <div className="flex items-center justify-center h-full">Please log in to view this section.</div>;
    }

    // Render view based on user role
    if (managerRoles.includes(user.role_id)) {
        return <QuizManagementView />;
    } else {
        // For roles 3 and 5, show their assignments.
        return <MyAssignmentsView />;
    }
};

export default QuizView; 