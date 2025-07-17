'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Control, Controller } from 'react-hook-form';
import { Template, CreateTemplateDto } from '@/types/template.type';
import { PlusCircle, Trash2, Folder, FileText, ChevronDownIcon, Settings } from 'lucide-react';
import { TemplateProjectDetails } from './TemplateProjectDetails';

// Modal component for editing project details
const DetailsModal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-4 border-b border-white/10 flex justify-end">
                     <button onClick={onClose} className="text-gray-400 hover:text-white">&times; Close</button>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}


// --- Reusable Components ---
const FormInput = ({ label, name, register, ...props }: React.ComponentProps<'input'> & { label: string, name: string, register: any }) => (
    <div className="flex-1">
        <label htmlFor={props.id || name} className="block text-sm font-bold text-gray-300 mb-1">{label}</label>
        <input {...register(name, { valueAsNumber: props.type === 'number' })} {...props} className="input-glass w-full" />
    </div>
);

const FormTextarea = ({ label, name, register, ...props }: React.ComponentProps<'textarea'> & { label: string, name: string, register: any }) => (
    <div>
        <label htmlFor={props.id || name} className="block text-sm font-bold text-gray-300 mb-1">{label}</label>
        <textarea {...register(name)} {...props} className="input-glass w-full min-h-[100px]" />
    </div>
);

// New CustomSelect component to replace FormSelect
interface CustomSelectProps {
    control: Control<any>;
    name: string;
    label: string;
    options: { value: string; label: string }[];
    defaultValue?: string;
}

const CustomSelect = ({ control, name, label, options, defaultValue }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={defaultValue}
            render={({ field }) => {
                const selectedOption = options.find(opt => opt.value === field.value);
                return (
                    <div className="flex-1 relative">
                        <label className="block text-sm font-bold text-gray-300 mb-1">{label}</label>
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="input-glass w-full flex justify-between items-center text-left h-[42px] px-3"
                        >
                            <span>{selectedOption?.label || <span className="text-gray-400">Select...</span>}</span>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-slate-900/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                                {options.map(option => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            field.onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1"
                                    >
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }}
        />
    );
};


const TaskDefinitionsForm = ({ control, register, projectIndex }: { control: Control<CreateTemplateDto>, register: any, projectIndex: number }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `projects.${projectIndex}.tasks`
    });

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
    ];

    return (
        <div className="col-span-full pl-6 border-l-2 border-slate-700 space-y-4">
            {fields.map((item, taskIndex) => (
                <div key={item.id} className="bg-black/20 p-3 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                         <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                        <FormInput
                            label={`Task #${taskIndex + 1} Title`}
                            name={`projects.${projectIndex}.tasks.${taskIndex}.title`}
                            register={register}
                            placeholder="e.g., 'Write article for {topic}'"
                        />
                         <button type="button" onClick={() => remove(taskIndex)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex items-end gap-3">
                        <FormInput
                            label="Start Day (relative)"
                            name={`projects.${projectIndex}.tasks.${taskIndex}.start_day`}
                            register={register}
                            type="number"
                            placeholder="e.g., 0"
                            defaultValue={0}
                        />
                        <FormInput
                            label="Duration (days)"
                            name={`projects.${projectIndex}.tasks.${taskIndex}.duration_days`}
                            register={register}
                            type="number"
                            placeholder="e.g., 1"
                            defaultValue={1}
                        />
                        <CustomSelect
                            label="Priority"
                            name={`projects.${projectIndex}.tasks.${taskIndex}.priority`}
                            control={control}
                            options={priorityOptions}
                            defaultValue="medium"
                        />
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={() => append({ title: '', description: '', priority: 'medium', start_day: 0, duration_days: 1 })}
                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
                <PlusCircle size={16} /> Add Task
            </button>
        </div>
    );
}

const ProjectDefinitionsForm = ({ control, register }: { control: Control<CreateTemplateDto>, register: any }) => {
    const { fields, append, remove } = useFieldArray({ control, name: "projects" });
    const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);

    return (
        <div className="col-span-full space-y-4">
            <h3 className="text-lg font-bold text-white">Project & Task Definitions</h3>
            <p className="text-sm text-gray-400 -mt-2">Define the projects and tasks that will be created from this template. Use placeholders like `{'{{client_name}}'}` in names.</p>
            {fields.map((item, index) => (
                <div key={item.id} className="bg-white/5 p-4 rounded-lg space-y-4">
                     <div className="flex items-center gap-4">
                        <Folder className="w-6 h-6 text-amber-400 flex-shrink-0"/>
                        <div className="flex-grow space-y-3">
                            <FormInput
                                label={`Project #${index + 1} Name Template`}
                                name={`projects.${index}.name`}
                                register={register}
                                placeholder="e.g., 'SEO Project for {client_name}'"
                            />
                             <div className="flex items-end gap-3">
                                <FormInput
                                    label="Start Day (relative)"
                                    name={`projects.${index}.start_day`}
                                    register={register}
                                    type="number"
                                    placeholder="e.g., 0"
                                    defaultValue={0}
                                />
                                <FormInput
                                    label="Duration (days)"
                                    name={`projects.${index}.duration_days`}
                                    register={register}
                                    type="number"
                                    placeholder="e.g., 5"
                                    defaultValue={1}
                                />
                                <button
                                    type="button"
                                    onClick={() => setEditingProjectIndex(index)}
                                    className="btn-secondary h-[42px] self-end flex items-center gap-2"
                                >
                                    <Settings size={16} /> Details
                                </button>
                            </div>
                        </div>
                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-400 p-2 self-start"><Trash2 size={18} /></button>
                     </div>
                     <TaskDefinitionsForm projectIndex={index} control={control} register={register} />
                </div>
            ))}
            <button
                type="button"
                onClick={() => append({ name: '', description: '', start_day: 0, duration_days: 1, tasks: [], details: { keywords_plan: [] } })}
                className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
            >
                <PlusCircle size={20} /> Add Project Definition
            </button>

            <DetailsModal isOpen={editingProjectIndex !== null} onClose={() => setEditingProjectIndex(null)}>
                {editingProjectIndex !== null && (
                    <TemplateProjectDetails
                        projectIndex={editingProjectIndex}
                        control={control}
                        register={register}
                    />
                )}
            </DetailsModal>
        </div>
    );
};


// --- Main Form Component ---
interface TemplateFormProps {
    template?: Template; // For editing
    onSubmit: (data: CreateTemplateDto) => void;
    isSubmitting: boolean;
}

export const TemplateForm = ({ template, onSubmit, isSubmitting }: TemplateFormProps) => {
  const { register, handleSubmit, reset, control } = useForm<CreateTemplateDto>({
    defaultValues: {
        name: '',
        description: '',
        projects: []
    }
  });

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        description: template.description || '',
        projects: template.projects || []
      });
    } else {
      reset({
        name: '',
        description: '',
        projects: []
      });
    }
  }, [template, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl space-y-4">
             <h2 className="text-xl font-bold text-white">Template Details</h2>
            <FormInput label="Template Name" name="name" register={register} placeholder="e.g., Standard SEO Package" required />
            <FormTextarea label="Template Description" name="description" register={register} placeholder="Describe what this template is for" />
        </div>
        
        <div className="p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl">
            <ProjectDefinitionsForm control={control} register={register} />
        </div>
        
        <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (template ? 'Save Changes' : 'Create Template')}
            </button>
        </div>
    </form>
  );
}; 