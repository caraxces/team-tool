'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { TemplateSummary, Template } from '@/types/template.type';
import { Team } from '@/types/team.type';
import { getTemplates, getTemplateById } from '@/services/template.service';
import { getMyTeams } from '@/services/team.service';
import { useAuth } from '@/context/AuthContext';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { GenerationParams } from '@/services/template.service';

interface GenerateFromTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (id: number, data: GenerationParams) => Promise<any>;
}

const extractVariables = (template: Template | null): string[] => {
    if (!template) return [];
    const regex = /\{(.*?)\}/g;
    let matches = new Set<string>();
    const searchIn = (text: string | null | undefined) => {
        if(!text) return;
        const found = text.match(regex);
        if (found) {
            found.forEach(match => matches.add(match.replace(/[{}]/g, '')));
        }
    };
    searchIn(template.description);
    template.projects.forEach(p => {
        searchIn(p.name); // updated from project_name_template
        searchIn(p.description); // updated from project_description_template
        p.tasks.forEach(t => {
            searchIn(t.title); // updated from task_name_template
            searchIn(t.description); // updated from task_description_template
        });
    });
    return Array.from(matches);
};


export const GenerateFromTemplateModal = ({ isOpen, onClose, onSuccess, onSubmit }: GenerateFromTemplateModalProps) => {
    const { handleSubmit, control, watch, reset, formState: { errors } } = useForm();
    const { state: authState } = useAuth();

    const [templates, setTemplates] = useState<TemplateSummary[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dropdown states
    const [isTemplateDropdownOpen, setTemplateDropdownOpen] = useState(false);
    const [isTeamDropdownOpen, setTeamDropdownOpen] = useState(false);
    const templateDropdownRef = useRef<HTMLDivElement>(null);
    const teamDropdownRef = useRef<HTMLDivElement>(null);
    
    const selectedTemplateId = watch('template_id');
    const selectedTeamId = watch('team_id');

    const variables = useMemo(() => extractVariables(selectedTemplate), [selectedTemplate]);
    
    const selectedTemplateForDisplay = templates.find(t => t.id === selectedTemplateId);
    const selectedTeamForDisplay = teams.find(t => t.id === selectedTeamId);

    // Effect to handle clicks outside of dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) setTemplateDropdownOpen(false);
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) setTeamDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            reset({ template_id: undefined, team_id: undefined, start_date: today });
            Promise.all([getTemplates(), getMyTeams()]).then(([tpls, tms]) => {
                setTemplates(tpls);
                setTeams(tms);
            }).catch(() => toast.error("Failed to load initial data."));
        }
    }, [isOpen, reset]);

    useEffect(() => {
        if (selectedTemplateId) {
            getTemplateById(selectedTemplateId)
                .then(setSelectedTemplate)
                .catch(() => toast.error("Failed to load template details."));
        } else {
            setSelectedTemplate(null);
        }
    }, [selectedTemplateId]);

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const { template_id, team_id, start_date, ...vars } = data;
            const params: GenerationParams = {
                team_id: team_id,
                start_date: start_date,
                variables: vars,
            };
            await onSubmit(template_id, params);
            toast.success("Projects generated successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast.error(`Failed to generate projects: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Generate Projects from Template</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-7 h-7" /></button>
                </div>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                     <Controller
                        name="template_id"
                        control={control}
                        rules={{ required: "Template is required" }}
                        render={({ field }) => (
                            <div className="relative" ref={templateDropdownRef}>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Select Template</label>
                                <button type="button" onClick={() => setTemplateDropdownOpen(!isTemplateDropdownOpen)} className="w-full flex justify-between items-center input-glass text-left">
                                    <span>{selectedTemplateForDisplay?.name || <span className="text-gray-400">-- Choose a template --</span>}</span>
                                    <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isTemplateDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full bg-slate-900/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                                    {templates.map((t) => (
                                    <div key={t.id} onClick={() => { field.onChange(t.id); setTemplateDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                                        {t.name}
                                    </div>
                                    ))}
                                </div>
                                )}
                                {errors.template_id && <p className="text-red-400 text-xs mt-1">{errors.template_id.message?.toString()}</p>}
                            </div>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                        <Controller
                            name="team_id"
                            control={control}
                            rules={{ required: "Team is required" }}
                            render={({ field }) => (
                                <div className="relative" ref={teamDropdownRef}>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Assign to Team</label>
                                    <button type="button" onClick={() => setTeamDropdownOpen(!isTeamDropdownOpen)} className="w-full flex justify-between items-center input-glass text-left">
                                        <span>{selectedTeamForDisplay?.name || <span className="text-gray-400">-- Choose a team --</span>}</span>
                                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isTeamDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-slate-900/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                                        {teams.map((t) => (
                                        <div key={t.id} onClick={() => { field.onChange(t.id); setTeamDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                                            {t.name}
                                        </div>
                                        ))}
                                    </div>
                                    )}
                                     {errors.team_id && <p className="text-red-400 text-xs mt-1">{errors.team_id.message?.toString()}</p>}
                                </div>
                            )}
                        />
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Project Start Date</label>
                            <Controller
                                name="start_date"
                                control={control}
                                rules={{ required: "Start date is required" }}
                                render={({ field }) => <input type="date" {...field} className="input-glass w-full" />}
                            />
                            {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message?.toString()}</p>}
                        </div>
                    </div>
                    
                    {variables.length > 0 && (
                        <div className="p-4 border border-dashed border-white/20 rounded-lg space-y-4">
                            <h3 className="font-semibold text-cyan-400">Template Variables</h3>
                            <p className="text-sm text-gray-400 -mt-2">Fill in the values for the placeholders defined in the template.</p>
                            {variables.map(variable => (
                                <div key={variable}>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">{`Value for {${variable}}`}</label>
                                    <Controller
                                        name={variable}
                                        control={control}
                                        rules={{ required: `Value for ${variable} is required` }}
                                        render={({ field }) => <input {...field} className="input-glass w-full" placeholder={`Enter value for {${variable}}`} />}
                                    />
                                     {errors[variable] && <p className="text-red-400 text-xs mt-1">{errors[variable]?.message?.toString()}</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-6 flex justify-end">
                        <button type="submit" className="btn-primary" disabled={isSubmitting || !selectedTemplateId}>
                            {isSubmitting ? 'Generating...' : 'Generate Projects'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}; 