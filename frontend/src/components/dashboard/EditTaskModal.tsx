'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Task, CreateTaskPayload } from '@/types/task.type';
import { User } from '@/types/user.type';
import { updateTask } from '@/services/task.service';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  task: Task | null;
  users: User[];
}

export const EditTaskModal = ({ isOpen, onClose, onTaskUpdated, task, users }: EditTaskModalProps) => {
    const { register, handleSubmit, control, reset, watch } = useForm<CreateTaskPayload>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isAssigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);
    const [isPriorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
    const priorityDropdownRef = useRef<HTMLDivElement>(null);

    const selectedAssigneeId = watch('assigneeId');
    const selectedAssignee = users.find(u => u.id === selectedAssigneeId);

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
    ];
    const selectedPriority = watch('priority');
    const priorityLabel = priorityOptions.find(p => p.value === selectedPriority)?.label;

    useEffect(() => {
        if (task) {
            reset({
                title: task.title,
                description: task.description,
                assigneeId: task.assignee?.id || null,
                priority: task.priority,
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : null,
            });
        }
    }, [task, reset]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
                setAssigneeDropdownOpen(false);
            }
            if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
                setPriorityDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFormSubmit = async (data: CreateTaskPayload) => {
        if (!task) return;
        setIsSubmitting(true);
        try {
            const payload = { ...data };
            if (payload.dueDate === '') payload.dueDate = null;
            
            await updateTask(task.id, payload);
            toast.success('Task updated successfully!');
            onTaskUpdated();
            onClose();
        } catch (error) {
            toast.error('Failed to update task.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Edit Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-7 h-7" /></button>
                </div>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Title</label>
                        <input {...register('title', { required: true })} className="input-glass w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Description</label>
                        <textarea {...register('description')} className="input-glass w-full min-h-[100px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                         {/* Assignee Dropdown */}
                        <div className="relative" ref={assigneeDropdownRef}>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Assignee</label>
                            <Controller
                                name="assigneeId"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <button type="button" onClick={() => setAssigneeDropdownOpen(!isAssigneeDropdownOpen)} className="w-full flex justify-between items-center input-glass text-left">
                                            <span>{selectedAssignee?.fullName || <span className="text-gray-400">Unassigned</span>}</span>
                                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isAssigneeDropdownOpen && (
                                            <div className="absolute z-10 mt-1 w-full bg-slate-900/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-48 overflow-auto custom-scrollbar">
                                                 <div onClick={() => { field.onChange(null); setAssigneeDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1 text-gray-400">Unassigned</div>
                                                {users.map(user => (
                                                    <div key={user.id} onClick={() => { field.onChange(user.id); setAssigneeDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                                                        {user.fullName}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-300 mb-2">Due Date</label>
                           <input type="date" {...register('dueDate')} className="input-glass w-full" />
                        </div>
                    </div>
                     {/* Priority Dropdown */}
                    <div className="relative" ref={priorityDropdownRef}>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Priority</label>
                        <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                                <>
                                    <button type="button" onClick={() => setPriorityDropdownOpen(!isPriorityDropdownOpen)} className="w-full flex justify-between items-center input-glass text-left">
                                        <span>{priorityLabel || <span className="text-gray-400">Select Priority</span>}</span>
                                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isPriorityDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-slate-900/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-48 overflow-auto custom-scrollbar">
                                        {priorityOptions.map(opt => (
                                            <div key={opt.value} onClick={() => { field.onChange(opt.value); setPriorityDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                    )}
                                </>
                            )}
                        />
                    </div>
                    <div className="pt-6 flex justify-end">
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}; 