'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from '@/services/template.service';
import { Template, TemplateSummary, CreateTemplateDto } from '@/types/template.type';
import { TemplateForm } from './TemplateForm';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { ConfirmationModal } from './ConfirmationModal';

export const TemplateManagementView = () => {
    const queryClient = useQueryClient();
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    // Fetch list of templates
    const { data: templates, isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery<TemplateSummary[]>({
        queryKey: ['templates'],
        queryFn: getTemplates,
    });

    // Fetch details of the selected template
    const { data: selectedTemplate, isLoading: isLoadingDetails } = useQuery<Template | null>({
        queryKey: ['template', selectedTemplateId],
        queryFn: () => selectedTemplateId ? getTemplateById(selectedTemplateId) : null,
        enabled: !!selectedTemplateId,
    });

    // Mutation for creating a template
    const { mutate: createMutate, isPending: isCreatingPending } = useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            toast.success('Template created successfully!');
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            setIsCreating(false);
        },
        onError: (err) => toast.error(`Failed to create template: ${err.message}`),
    });

    // Mutation for updating a template
    const { mutate: updateMutate, isPending: isUpdatingPending } = useMutation({
        mutationFn: ({ id, data }: { id: number, data: CreateTemplateDto }) => updateTemplate(id, data),
        onSuccess: () => {
            toast.success('Template updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            queryClient.invalidateQueries({ queryKey: ['template', selectedTemplateId] });
        },
        onError: (err) => toast.error(`Failed to update template: ${err.message}`),
    });
    
    // Mutation for deleting a template
    const { mutate: deleteMutate } = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            toast.success('Template deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            setSelectedTemplateId(null);
            setDeleteModalOpen(false);
        },
        onError: (err) => toast.error(`Failed to delete template: ${err.message}`),
    });

    const handleFormSubmit = (data: CreateTemplateDto) => {
        if (isCreating) {
            createMutate(data);
        } else if (selectedTemplateId) {
            updateMutate({ id: selectedTemplateId, data });
        }
    };
    
    const handleDeleteConfirm = () => {
        if (selectedTemplateId) {
            deleteMutate(selectedTemplateId);
        }
    }

    const handleSelectTemplate = (id: number) => {
        setIsCreating(false);
        setSelectedTemplateId(id);
    }
    
    const handleAddNew = () => {
        setSelectedTemplateId(null);
        setIsCreating(true);
    }

    return (
        <>
            <div className="flex h-full bg-black/20 rounded-2xl overflow-hidden">
                {/* Left Panel: Template List */}
                <div className="w-1/3 border-r border-white/10 overflow-y-auto p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Templates</h2>
                        <button onClick={handleAddNew} className="btn-primary p-2">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                    {isLoadingTemplates ? <p>Loading...</p> : (
                        <ul className="space-y-2">
                            {templates?.map(t => (
                                <li key={t.id} onClick={() => handleSelectTemplate(t.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTemplateId === t.id ? 'bg-cyan-600/50' : 'hover:bg-white/10'}`}>
                                    <h3 className="font-semibold text-white">{t.name}</h3>
                                    <p className="text-sm text-gray-400 truncate">{t.description}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Right Panel: Form or Placeholder */}
                <div className="w-2/3 h-full overflow-y-auto custom-scrollbar p-6">
                    {isCreating || selectedTemplateId ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {isCreating ? 'Create New Template' : `Edit: ${selectedTemplate?.name}`}
                                </h2>
                                {!isCreating && selectedTemplateId && (
                                    <button onClick={() => setDeleteModalOpen(true)} className="btn-danger p-2">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <TemplateForm
                                onSubmit={handleFormSubmit}
                                isSubmitting={isCreatingPending || isUpdatingPending}
                                template={isCreating ? undefined : (selectedTemplate || undefined)}
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ChevronDoubleRightIcon className="w-16 h-16 mb-4 text-gray-500"/>
                            <h2 className="text-2xl font-bold mb-2 text-white">Select a Template</h2>
                            <p>Select a template from the list to view or edit, or create a new one.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Template"
                message={`Are you sure you want to delete this template? This will also delete all associated project/task definitions and cannot be undone.`}
            />
        </>
    );
}; 