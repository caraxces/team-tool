'use client';

import React from 'react';
import { useForm, useFieldArray, Control, UseFormRegister } from 'react-hook-form';
import { CreateTemplateDto } from '@/types/template.type';
import { ChevronDown, ChevronUp, Info, Users, Target, VenetianMask, BookText, Link, PlusCircle, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type TForm = CreateTemplateDto;

// Reusable Input/Textarea components for consistent styling
const FormInput = (props: React.ComponentProps<'input'> & { label: string, name: string, register: UseFormRegister<TForm> }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-bold text-gray-300 mb-1">{props.label}</label>
        <input {...props.register(props.name as any)} {...props} className="input-glass w-full" />
    </div>
);

const FormTextarea = (props: React.ComponentProps<'textarea'> & { label: string, name: string, register: UseFormRegister<TForm> }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-bold text-gray-300 mb-1">{props.label}</label>
        <textarea {...props.register(props.name as any)} {...props} className="input-glass w-full min-h-[120px]" />
    </div>
);

// Collapsible section component - Adapted from ProjectDetailsWidget
const Section = ({ title, icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const Icon = icon;
    return (
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-cyan-400"/>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>
                {isOpen ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Keyword planning sub-form - Adapted for TemplateForm
const KeywordsForm = ({ control, register, projectIndex }: { control: Control<TForm>, register: UseFormRegister<TForm>, projectIndex: number }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `projects.${projectIndex}.details.keywords_plan` as const
    });

    return (
        <div className="col-span-full space-y-4">
            {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/20 rounded-lg">
                    <FormInput label={`Page URL #${index + 1}`} name={`projects.${projectIndex}.details.keywords_plan.${index}.page`} register={register} placeholder="e.g., /services/{service_name}" />
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                         <FormInput label="Main Keyword" name={`projects.${projectIndex}.details.keywords_plan.${index}.mainKeyword.keyword`} register={register} placeholder="e.g., SEO for {industry}" />
                         <FormInput label="Volume" name={`projects.${projectIndex}.details.keywords_plan.${index}.mainKeyword.volume`} register={register} type="number" placeholder="e.g., 1500" />
                    </div>
                    <div className="col-span-full">
                         <FormTextarea label="Sub-keywords (one per line, format: keyword,volume)" name={`projects.${projectIndex}.details.keywords_plan.${index}.subKeywordsRaw`} register={register} placeholder="keyword one, 100&#10;keyword two, 80" />
                    </div>
                     <div className="col-span-full flex justify-end">
                        <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={() => append({ page: '', mainKeyword: { keyword: '', volume: 0 }, subKeywords: [] })}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
                <PlusCircle size={20} /> Add Keyword Page
            </button>
        </div>
    );
}

// Main component for the modal content
interface TemplateProjectDetailsProps {
    projectIndex: number;
    control: Control<TForm>;
    register: UseFormRegister<TForm>;
}

export const TemplateProjectDetails = ({ projectIndex, control, register }: TemplateProjectDetailsProps) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Template Project Details</h2>
            <p className="text-sm text-gray-400 -mt-4">Define the details for this project template. You can use placeholders like `{'{{variable}}'}` which managers will fill in later.</p>

            <Section title="Customer Provided Information" icon={Info}>
                <FormTextarea label="Product Information" name={`projects.${projectIndex}.details.product_info`} register={register} placeholder="Describe the product/service..." />
                <FormInput label="Platform Accounts" name={`projects.${projectIndex}.details.platform_accounts`} register={register} placeholder="e.g., Google, Facebook credentials..." />
                <FormInput label="Image Folder Link" name={`projects.${projectIndex}.details.image_folder_link`} register={register} placeholder="https://..." />
                <FormInput label="Brand Guideline Link" name={`projects.${projectIndex}.details.brand_guideline_link`} register={register} placeholder="https://..." />
                <FormTextarea label="Other Customer Notes" name={`projects.${projectIndex}.details.customer_notes`} register={register} className="col-span-full" placeholder="Any other notes from the customer..." />
            </Section>
            
            <Section title="Project Goals" icon={Target}>
                <FormTextarea label="KPIs" name={`projects.${projectIndex}.details.kpis`} register={register} placeholder="List the Key Performance Indicators..." className="col-span-full" />
            </Section>

            <Section title="Personnel" icon={Users}>
                <FormInput label="Number of People" name={`projects.${projectIndex}.details.personnel_count`} register={register} type="number" placeholder="e.g., 5" />
                <FormInput label="Levels (e.g., 2 Senior, 3 Junior)" name={`projects.${projectIndex}.details.personnel_levels`} register={register} placeholder="Describe the team composition..." />
            </Section>

            <Section title="Strategy" icon={BookText}>
                <FormTextarea label="Content Strategy" name={`projects.${projectIndex}.details.content_strategy`} register={register} className="col-span-full" placeholder="Outline the overall content strategy..." />
                <FormInput label="Number of Website Pages" name={`projects.${projectIndex}.details.website_page_count`} register={register} type="number" placeholder="e.g., 10" />
                <FormTextarea label="Content Cluster Model" name={`projects.${projectIndex}.details.cluster_model`} register={register} className="col-span-full" placeholder="Describe the topic cluster model..." />
                <FormTextarea label="Internal Linking Plan" name={`projects.${projectIndex}.details.internal_link_plan`} register={register} className="col-span-full" placeholder="Describe the internal linking plan..." />
            </Section>

            <Section title="Keyword Plan" icon={VenetianMask}>
                 <KeywordsForm control={control} register={register} projectIndex={projectIndex} />
            </Section>
        </div>
    );
}; 