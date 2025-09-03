import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, ChevronDownIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { createProject, downloadProjectCsvTemplate, importProjectsFromCsv } from '@/services/project.service';
import { User } from '@/types/user.type';

// Zod schema remains the same
const createProjectFormSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters.'),
  description: z.string().optional(),
  picId: z.coerce.number().optional(),
  memberIds: z.array(z.coerce.number()).optional(),
});
type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;


// --- Manual Form Component ---
const ManualCreateForm = ({ users, onFormSubmit, onCancel }: any) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        control,
        watch,
    } = useForm<CreateProjectFormValues>({
        resolver: zodResolver(createProjectFormSchema),
        defaultValues: {
            memberIds: [],
            picId: undefined,
        }
    });

    const [isPicDropdownOpen, setPicDropdownOpen] = useState(false);
    const picDropdownRef = useRef<HTMLDivElement>(null);

    const selectedPicId = watch('picId');
    const selectedPic = users.find((u: User) => u.id === selectedPicId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (picDropdownRef.current && !picDropdownRef.current.contains(event.target as Node)) {
                setPicDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                <input id="name" {...register('name')} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                <textarea id="description" {...register('description')} rows={3} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue"/>
            </div>
            
            {/* PIC Custom Dropdown */}
            <Controller
                name="picId"
                control={control}
                render={({ field }) => (
                <div className="relative" ref={picDropdownRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Person In Charge (PIC)</label>
                    <button type="button" onClick={() => setPicDropdownOpen(!isPicDropdownOpen)} className="w-full flex justify-between items-center bg-dark-blue border border-white/20 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-neon-blue">
                        <span>{selectedPic ? selectedPic.fullName : <span className="text-gray-400">Select a PIC</span>}</span>
                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isPicDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isPicDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                        <div onClick={() => { field.onChange(undefined); setPicDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1 text-gray-400">
                            None
                        </div>
                        {users.map((user: User) => (
                        <div key={user.id} onClick={() => { field.onChange(user.id); setPicDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                            {user.fullName}
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                )}
            />

             <div>
                <label htmlFor="memberIds" className="block text-sm font-medium text-gray-300 mb-1">Members</label>
                <select id="memberIds" {...register('memberIds')} multiple className="w-full bg-dark-blue border border-white/20 rounded-lg px-3 py-2 h-32 text-white custom-scrollbar">
                    {Array.isArray(users) && users.map((user: User) => <option key={user.id} value={user.id} className="p-2 hover:bg-white/10 rounded-md">{user.fullName}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-white/10 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-neon-blue text-dark-blue font-bold rounded-lg">
                    {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
            </div>
        </form>
    );
};


// --- CSV Import Component (Almost identical to the one in CreateTaskModal) ---
const CsvImportView = ({ onImportFinished, onCancel }: any) => {
    // This component's logic is nearly identical to the task one.
    // It calls `downloadProjectCsvTemplate` and `importProjectsFromCsv`.
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false,
    });
    
    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadProjectCsvTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'projects-template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) { toast.error("Failed to download template."); }
    };

    const handleImport = async () => {
        if (!file) return;
        setIsImporting(true);
        try {
            const result = await importProjectsFromCsv(file);
             toast.success(result.message);
            if (result.data.errors && result.data.errors.length > 0) {
                 toast.custom(t => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-dark-blue shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-white/20`}>
                       <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5"><ExclamationCircleIcon className="h-10 w-10 text-yellow-400"/></div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-white">Import Issues</p>
                                    <p className="mt-1 text-sm text-gray-400">
                                        {result.data.errors.length} rows failed. First: Row {result.data.errors[0].row}, {result.data.errors[0].reason}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 6000 });
            }
            onImportFinished();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Import failed.');
        } finally {
            setIsImporting(false);
        }
    };
    
     return (
        <div className="pt-4 text-white">
            <button onClick={handleDownloadTemplate} className="w-full flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-white/10 rounded-lg hover:bg-white/20">
                <DocumentArrowDownIcon className="h-5 w-5" /> Download CSV Template
            </button>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer ${isDragActive ? 'border-neon-pink' : 'border-white/30'}`}>
                <input {...getInputProps()} />
                <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2"/>
                <p>{file ? file.name : "Drag 'n' drop a .csv file here, or click to select"}</p>
            </div>
            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-white/10 rounded-lg">Cancel</button>
                <button onClick={handleImport} disabled={!file || isImporting} className="py-2 px-4 bg-neon-blue text-dark-blue font-bold rounded-lg disabled:opacity-50">
                    {isImporting ? 'Importing...' : 'Start Import'}
                </button>
            </div>
        </div>
    );
};

// --- Main Modal Component ---
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
  users: User[];
  initialTab?: 'manual' | 'csv';
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onProjectCreated, users, initialTab = 'manual' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const onSubmit = async (data: CreateProjectFormValues) => {
    try {
      await createProject(data);
      toast.success('Project created successfully!');
      onProjectCreated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-dark-blue border border-white/20 rounded-2xl shadow-lg w-full max-w-2xl p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Create New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="border-b border-white/20 mb-4">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button onClick={() => setActiveTab('manual')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'manual' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-400'}`}>
              Create Manually
            </button>
            <button onClick={() => setActiveTab('csv')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'csv' ? 'border-b-2 border-neon-blue text-neon-blue' : 'text-gray-400'}`}>
              Import from CSV
            </button>
          </nav>
        </div>
        <div>
          {activeTab === 'manual' && <ManualCreateForm users={users} onFormSubmit={onSubmit} onCancel={onClose} />}
          {activeTab === 'csv' && <CsvImportView onImportFinished={() => { onProjectCreated(); onClose(); }} onCancel={onClose} />}
        </div>
      </div>
    </div>
  );
}; 