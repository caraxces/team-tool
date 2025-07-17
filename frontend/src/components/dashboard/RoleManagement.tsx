'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';

import { getAllUsers, updateUserRole } from '@/services/user.service';
import { getRoles } from '@/services/role.service'; // We need to create this service
import { User } from '@/types/user.type';
import { Role } from '@/services/role.service'; // Re-using the interface

const RoleManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedUsers, fetchedRoles] = await Promise.all([
                getAllUsers(),
                getRoles()
            ]);
            setUsers(fetchedUsers);
            setRoles(fetchedRoles);
        } catch (error) {
            toast.error("Failed to load data for role management.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleChange = async (userId: number, newRoleId: number) => {
        try {
            await updateUserRole(userId, newRoleId);
            toast.success("User's role updated successfully.");
            // Refresh local data
            setUsers(users.map(user => 
                user.id === userId ? { ...user, role_id: newRoleId } : user
            ));
        } catch (error) {
            toast.error("Failed to update role.");
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading roles and permissions...</div>;
    }

    return (
        <div className="mt-12">
             <h2 className="text-xl font-semibold mb-2 flex items-center">
                <ShieldCheck className="h-6 w-6 mr-3 text-indigo-500" />
                Role & Permission Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Assign roles to users to control their access to different parts of the application.
            </p>
            <div className="overflow-x-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assign New Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {roles.find(r => r.id === user.role_id)?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <select
                                        value={user.role_id}
                                        onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                                        className="w-full bg-white/5 dark:bg-gray-700/50 border border-gray-300 dark:border-white/20 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                                        aria-label={`Role for ${user.fullName}`}
                                    >
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoleManagement; 