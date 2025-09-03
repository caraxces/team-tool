'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, PlusIcon, TrashIcon, CheckCircle, LinkIcon, UserPlus, Send, FileText, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { getKnowledgeItems, createKnowledgeItem, markKnowledgeItemAsDone, deleteKnowledgeItem, KnowledgeItem, CreateKnowledgeItemPayload } from '@/services/knowledge.service';
import { getUsers } from '@/services/user.service';
import { User } from '@/types/user.type';
import { useAuth } from '@/context/AuthContext';
import { XMarkIcon, ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import QuizManagementView from './QuizManagementView';


// Helper to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Modal for Creating a new Knowledge Item
const CreateKnowledgeItemModal = ({ isOpen, onClose, onCreated, users }: { isOpen: boolean, onClose: () => void, onCreated: (newItem: KnowledgeItem) => void, users: User[] }) => {
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAssigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
    const assigneeDropdownRef = useRef<HTMLDivElement>(null);

    const selectedAssignee = users.find(u => u.id === assigneeId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
            setAssigneeDropdownOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !link) {
            toast.error("Title and Link are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload: CreateKnowledgeItemPayload = { title, link, description, assigneeId: assigneeId || undefined };
            const newItem = await createKnowledgeItem(payload);
            toast.success("Knowledge item created!");
            onCreated(newItem);
            onClose();
            // Reset form
            setTitle('');
            setLink('');
            setDescription('');
            setAssigneeId(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create item.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-dark-blue border border-white/20 rounded-2xl shadow-lg w-full max-w-lg p-6 m-4 text-white">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add New Knowledge Item</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Project Onboarding Guide" className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Link</label>
                        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/doc" className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue"></textarea>
                    </div>
                     <div className="relative" ref={assigneeDropdownRef}>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Assign To (Optional)</label>
                        <button
                            type="button"
                            onClick={() => setAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                            className="w-full flex justify-between items-center bg-dark-blue border border-white/20 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-neon-blue"
                        >
                            <span>{selectedAssignee ? selectedAssignee.fullName : <span className="text-gray-400">Select an assignee</span>}</span>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isAssigneeDropdownOpen && (
                            <div className="absolute z-20 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                                <div
                                    onClick={() => {
                                        setAssigneeId(null);
                                        setAssigneeDropdownOpen(false);
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1 text-gray-400"
                                >
                                    Nobody
                                </div>
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => {
                                            setAssigneeId(user.id);
                                            setAssigneeDropdownOpen(false);
                                        }}
                                        className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1"
                                    >
                                        {user.fullName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-neon-blue text-dark-blue font-bold rounded-lg shadow-neon-blue hover:scale-105 transition-transform disabled:opacity-50">
                            {isSubmitting ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// TODO: Create this component in a new file
const MyAssignmentsView = () => (
    <div className="w-full h-full flex items-center justify-center text-gray-400">
        <p>My Assignments View - Coming Soon</p>
    </div>
);


const KnowledgeBaseView = () => {
    const { state: authState } = useAuth();
    const currentUser = authState.user;
    const [activeView, setActiveView] = useState<'library' | 'quiz_management' | 'my_assignments'>('library');

    // Determine which views are available based on user role
    const availableViews = useMemo(() => {
        const views: ('library' | 'quiz_management' | 'my_assignments')[] = ['library'];
        if (!currentUser) return views;

        if ([1, 2, 4].includes(currentUser.role_id)) {
            views.push('quiz_management');
        }
        if ([3, 5].includes(currentUser.role_id)) {
            views.push('my_assignments');
        }
        return views;
    }, [currentUser]);

    useEffect(() => {
        // If the current active view is not available anymore (e.g., after a role change), default to the first available one.
        if (!availableViews.includes(activeView)) {
            setActiveView(availableViews[0] || 'library');
        }
    }, [availableViews, activeView]);

    const renderActiveView = () => {
        switch(activeView) {
            case 'quiz_management':
                return <QuizManagementView />;
            case 'my_assignments':
                return <MyAssignmentsView />;
            case 'library':
            default:
                return <KnowledgeLibraryView />;
        }
    }

    return (
        <div className="bg-dark-blue/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-shrink-0 border-b border-white/10 mb-4">
                <nav className="flex space-x-4" aria-label="Tabs">
                    {availableViews.includes('library') && (
                         <button onClick={() => setActiveView('library')} className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-lg ${activeView === 'library' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-400 hover:text-white'}`}>
                            <BookOpen size={16} /> Knowledge Library
                        </button>
                    )}
                     {availableViews.includes('quiz_management') && (
                         <button onClick={() => setActiveView('quiz_management')} className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-lg ${activeView === 'quiz_management' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-400 hover:text-white'}`}>
                            <FileText size={16} /> Quiz Management
                        </button>
                    )}
                    {availableViews.includes('my_assignments') && (
                         <button onClick={() => setActiveView('my_assignments')} className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-lg ${activeView === 'my_assignments' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-400 hover:text-white'}`}>
                            <Award size={16} /> My Assignments
                        </button>
                    )}
                </nav>
            </div>
            <div className="flex-grow overflow-hidden">
                {renderActiveView()}
            </div>
        </div>
    );
}

/**
 * Extracted the original view into its own component for clarity
 */
const KnowledgeLibraryView = () => {
    const { state: authState } = useAuth();
    const currentUser = authState.user;
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedItems, fetchedUsers] = await Promise.all([
                    getKnowledgeItems(),
                    getUsers(),
                ]);
                setItems(fetchedItems);
                if (fetchedItems.length > 0) {
                    setSelectedItem(fetchedItems[0]);
                }
                setUsers(fetchedUsers);
            } catch (error) {
                toast.error("Failed to fetch data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleItemCreated = (newItem: KnowledgeItem) => {
        setItems(prev => [newItem, ...prev]);
        setSelectedItem(newItem); // Select the newly created item
    }
    
    const handleMarkAsDone = async (item: KnowledgeItem) => {
        if (item.status === 'done') return;
        try {
            const updatedItem = await markKnowledgeItemAsDone(item.id);
            setItems(prevItems => prevItems.map(i => i.id === item.id ? updatedItem : i));
            if(selectedItem?.id === item.id) {
                setSelectedItem(updatedItem);
            }
            toast.success("Item marked as done!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Could not mark as done.");
        }
    };
    
    const handleDelete = async (itemId: number) => {
        if(!window.confirm("Are you sure you want to delete this item?")) return;
        
        try {
            await deleteKnowledgeItem(itemId);
            setItems(prevItems => prevItems.filter(i => i.id !== itemId));
            if(selectedItem?.id === itemId) {
                setSelectedItem(items.length > 1 ? items.filter(i => i.id !== itemId)[0] : null);
            }
            toast.success("Item deleted.");
        } catch (error: any) {
             toast.error(error.response?.data?.message || "Could not delete item.");
        }
    };


    const isAssignee = selectedItem?.assignee?.id === currentUser?.id;
    const isCreator = selectedItem?.createdBy.id === currentUser?.id;

    if (isLoading) {
        return <div className="text-center p-10">Loading Knowledge Base...</div>;
    }

    return (
        <>
        <CreateKnowledgeItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleItemCreated} users={users} />
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
            {/* Left Panel: List of items - hidden on mobile when an item is selected */}
            <div className={`w-full md:w-1/3 flex-shrink-0 bg-white/5 rounded-xl p-3 flex flex-col ${selectedItem ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Knowledge Library</h2>
                    <button onClick={() => setIsModalOpen(true)} className="p-2 bg-neon-blue/20 text-neon-blue rounded-full hover:bg-neon-blue/40 transition-colors">
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {items.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">No items yet.</div>
                    ) : (
                        <ul className="space-y-2">
                            {items.map(item => (
                                <li key={item.id} onClick={() => setSelectedItem(item)} className={`p-3 rounded-lg cursor-pointer border-l-4 transition-colors ${selectedItem?.id === item.id ? 'bg-neon-blue/20 border-neon-blue' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold truncate pr-2">{item.title}</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.status === 'done' ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {item.assignee ? `Assigned to ${item.assignee.fullName}` : "Unassigned"}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Right Panel: Selected item details */}
            <div className={`w-full md:w-2/3 bg-white/5 rounded-xl p-6 flex-col ${selectedItem ? 'flex' : 'hidden md:flex'}`}>
                {selectedItem ? (
                    <>
                        {/* Back button for mobile */}
                        <button onClick={() => setSelectedItem(null)} className="md:hidden flex items-center text-gray-300 mb-4">
                            <ChevronLeftIcon className="h-5 w-5 mr-2" />
                            Back to Library
                        </button>

                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${selectedItem.status === 'done' ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'}`}>
                                        {selectedItem.status.toUpperCase()}
                                    </span>
                                    <h1 className="text-3xl font-bold mt-3 text-white">{selectedItem.title}</h1>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Created by <span className="font-semibold text-gray-300">{selectedItem.createdBy.fullName}</span> on {formatDate(selectedItem.createdAt)}
                                    </p>
                                </div>
                                {isCreator && (
                                     <button onClick={() => handleDelete(selectedItem.id)} className="p-2 text-gray-500 hover:text-neon-pink hover:bg-neon-pink/10 rounded-full transition-colors">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                )}
                            </div>
                            <div className="my-6 border-b border-white/10"></div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-gray-300 flex items-center gap-2"><LinkIcon className="h-5 w-5 text-neon-blue"/> Link</h3>
                                    <a href={selectedItem.link} target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline break-all">{selectedItem.link}</a>
                                </div>
                                {selectedItem.description && (
                                    <div>
                                        <h3 className="font-bold text-gray-300">Description</h3>
                                        <p className="text-gray-400 whitespace-pre-wrap">{selectedItem.description}</p>
                                    </div>
                                )}
                                 <div>
                                    <h3 className="font-bold text-gray-300 flex items-center gap-2"><UserPlus className="h-5 w-5 text-neon-blue"/> Assignee</h3>
                                    <p className="text-gray-400">{selectedItem.assignee ? selectedItem.assignee.fullName : 'Not assigned to anyone.'}</p>
                                </div>
                            </div>
                        </div>
                        {isAssignee && selectedItem.status === 'pending' && (
                             <button onClick={() => handleMarkAsDone(selectedItem)} className="w-full mt-6 py-3 bg-green-600/30 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-lg border border-green-500/50 backdrop-blur-xl hover:bg-green-600/50 shadow-lg transition-all duration-300">
                                <CheckCircle className="h-6 w-6"/> Mark as Done
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <BookOpen className="h-16 w-16 mb-4"/>
                        <h2 className="text-xl font-bold">Select an item</h2>
                        <p>Choose an item from the list to see its details, or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

export default KnowledgeBaseView; 