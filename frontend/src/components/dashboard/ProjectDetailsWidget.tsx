'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getProjectDetails, updateProjectDetails } from '@/services/project.service';
import { ProjectDetails, ProjectKeyword } from '@/types/project.type';
import { ChevronDown, ChevronUp, Info, Users, Target, VenetianMask, BookText, Link, PlusCircle, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ProjectDetailsWidgetProps {
  projectId: number;
  isReadOnly: boolean;
}

// Reusable Input/Textarea components for consistent styling
const FormInput = (props: React.ComponentProps<'input'> & { label: string, name: string, register: any, isReadOnly: boolean }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-bold text-gray-300 mb-1">{props.label}</label>
        <input {...props.register(props.name)} {...props} disabled={props.isReadOnly} className="input-glass w-full" />
    </div>
);

const FormTextarea = (props: React.ComponentProps<'textarea'> & { label: string, name: string, register: any, isReadOnly: boolean }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-bold text-gray-300 mb-1">{props.label}</label>
        <textarea {...props.register(props.name)} {...props} disabled={props.isReadOnly} className="input-glass w-full min-h-[120px]" />
    </div>
);

// Collapsible section component
const Section = ({ title, icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(true);
    const Icon = icon;
    return (
        <div className="bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4">
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

// Keyword planning sub-form
const KeywordsForm = ({ control, register, isReadOnly }: { control: any, register: any, isReadOnly: boolean }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "keywords_plan"
    });

    return (
        <div className="col-span-full space-y-4">
            {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/20 rounded-lg">
                    {/* Page URL */}
                    <FormInput label={`Page URL #${index + 1}`} name={`keywords_plan.${index}.page`} register={register} placeholder="e.g., /services/seo" isReadOnly={isReadOnly} />
                    {/* Main Keyword */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                         <FormInput label="Main Keyword" name={`keywords_plan.${index}.mainKeyword.keyword`} register={register} placeholder="e.g., SEO Services" isReadOnly={isReadOnly} />
                         <FormInput label="Volume" name={`keywords_plan.${index}.mainKeyword.volume`} register={register} type="number" placeholder="e.g., 1500" isReadOnly={isReadOnly} />
                    </div>
                    {/* Sub Keywords can be a textarea for simplicity */}
                    <div className="col-span-full">
                         <FormTextarea label="Sub-keywords (one per line)" name={`keywords_plan.${index}.subKeywordsRaw`} register={register} placeholder="keyword1, 100&#10;keyword2, 80" isReadOnly={isReadOnly} />
                    </div>
                     <div className="col-span-full flex justify-end">
                        {!isReadOnly && <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>}
                    </div>
                </div>
            ))}
            {!isReadOnly && <button
                type="button"
                onClick={() => append({ page: '', mainKeyword: { keyword: '', volume: 0 }, subKeywords: [] })}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
                <PlusCircle size={20} /> Add Keyword Page
            </button>}
        </div>
    );
}

export const ProjectDetailsWidget = ({ projectId, isReadOnly }: ProjectDetailsWidgetProps) => {
  const { register, handleSubmit, reset, control, formState: { isSubmitting, isDirty } } = useForm<ProjectDetails>();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!projectId) return;
      try {
        const details = await getProjectDetails(projectId);
        if (details) {
          // Massage data before resetting the form
          const formValues = { ...details };
          if (formValues.keywords_plan) {
            (formValues as any).keywords_plan = formValues.keywords_plan.map(plan => {
              const subKeywordsRaw = (plan.subKeywords || [])
                .map(sk => `${sk.keyword},${sk.volume}`)
                .join('\n');
              return { ...plan, subKeywordsRaw };
            });
          }
          reset(formValues);
        } else {
          // Reset with default empty structure if no details exist
          reset({
            product_info: '',
            platform_accounts: '',
            image_folder_link: '',
            brand_guideline_link: '',
            customer_notes: '',
            kpis: '',
            personnel_count: undefined,
            personnel_levels: '',
            content_strategy: '',
            website_page_count: undefined,
            cluster_model: '',
            internal_link_plan: '',
            keywords_plan: []
          });
        }
      } catch (error) {
        toast.error('Failed to load project details.');
        console.error("Fetch Details Error:", error);
      }
    };
    fetchDetails();
  }, [projectId, reset]);

  const onSubmit = async (data: ProjectDetails) => {
    const toastId = toast.loading('Saving details...');
    try {
      // Massage data before sending
      const dataToSave = { ...data };
      // Convert raw sub-keywords to array of objects
      if (dataToSave.keywords_plan) {
          (dataToSave as any).keywords_plan = (dataToSave as any).keywords_plan.map((plan: any) => {
              let subKeywords = [];
              if (plan.subKeywordsRaw) {
                  subKeywords = plan.subKeywordsRaw.split('\n').map((line: string) => {
                      const [keyword, volume] = line.split(',');
                      return { keyword: keyword?.trim(), volume: parseInt(volume?.trim() || '0', 10) };
                  }).filter((k: any) => k.keyword);
              }
              const { subKeywordsRaw, ...rest } = plan;
              return { ...rest, subKeywords };
          });
      }

      await updateProjectDetails(projectId, dataToSave);
      toast.success('Project details saved!', { id: toastId });
    } catch (error) {
      toast.error('Failed to save details.', { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">Project Details</h2>
        
        <Section title="Customer Provided Information" icon={Info}>
            <FormTextarea label="Product Information" name="product_info" register={register} placeholder="Describe the product/service..." isReadOnly={isReadOnly} />
            <FormInput label="Platform Accounts" name="platform_accounts" register={register} placeholder="e.g., Google, Facebook credentials..." isReadOnly={isReadOnly} />
            <FormInput label="Image Folder Link" name="image_folder_link" register={register} placeholder="https://..." isReadOnly={isReadOnly} />
            <FormInput label="Brand Guideline Link" name="brand_guideline_link" register={register} placeholder="https://..." isReadOnly={isReadOnly} />
            <FormTextarea label="Other Customer Notes" name="customer_notes" register={register} className="col-span-full" placeholder="Any other notes from the customer..." isReadOnly={isReadOnly} />
        </Section>
        
        <Section title="Project Goals" icon={Target}>
            <FormTextarea label="KPIs" name="kpis" register={register} placeholder="List the Key Performance Indicators..." className="col-span-full" isReadOnly={isReadOnly} />
        </Section>

        <Section title="Personnel" icon={Users}>
            <FormInput label="Number of People" name="personnel_count" register={register} type="number" placeholder="e.g., 5" isReadOnly={isReadOnly} />
            <FormInput label="Levels (e.g., 2 Senior, 3 Junior)" name="personnel_levels" register={register} placeholder="Describe the team composition..." isReadOnly={isReadOnly} />
        </Section>

        <Section title="Strategy" icon={BookText}>
            <FormTextarea label="Content Strategy" name="content_strategy" register={register} className="col-span-full" placeholder="Outline the overall content strategy..." isReadOnly={isReadOnly} />
            <FormInput label="Number of Website Pages" name="website_page_count" register={register} type="number" placeholder="e.g., 10" isReadOnly={isReadOnly} />
            <FormTextarea label="Content Cluster Model" name="cluster_model" register={register} className="col-span-full" placeholder="Describe the topic cluster model..." isReadOnly={isReadOnly} />
            <FormTextarea label="Internal Linking Plan" name="internal_link_plan" register={register} className="col-span-full" placeholder="Describe the internal linking plan..." isReadOnly={isReadOnly} />
        </Section>

        <Section title="Keyword Plan" icon={VenetianMask}>
             <KeywordsForm control={control} register={register} isReadOnly={isReadOnly} />
        </Section>

        {!isReadOnly && <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Saving...' : 'Save All Details'}
            </button>
        </div>}
    </form>
  );
}; 