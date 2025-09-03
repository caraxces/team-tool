import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, ChevronDownIcon, DocumentArrowDownIcon, DocumentArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { createTask, downloadTaskCsvTemplate, importTasksFromCsv } from '@/services/task.service';
import { User } from '@/types/user.type';
import { Project } from '@/types/project.type';

const createTaskFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  assigneeId: z.coerce.number().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional().nullable(),
});

type CreateTaskFormValues = z.infer<typeof createTaskFormSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  users: User[];
  project: Project | null;
  initialTab?: 'manual' | 'csv';
}

const priorityOptions: { value: CreateTaskFormValues['priority']; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const ManualCreateForm = ({ project, users, onFormSubmit, onCancel }: any) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
        title: '',
        description: '',
        priority: 'medium',
        assigneeId: null,
        dueDate: null,
    }
  });

  const [isAssigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const [isPriorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  const selectedAssigneeId = watch('assigneeId');
  const selectedAssignee = users.find((u: User) => u.id === selectedAssigneeId);
  const selectedPriority = watch('priority');

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
  }, [assigneeDropdownRef, priorityDropdownRef]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
        <input id="title" {...register('title')} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue"/>
        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
      </div>

       <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea id="description" {...register('description')} rows={3} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue"/>
      </div>

      <Controller
        name="assigneeId"
        control={control}
        render={({ field }) => (
          <div className="relative" ref={assigneeDropdownRef}>
            <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
            <button
              type="button"
              onClick={() => setAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              className="w-full flex justify-between items-center bg-dark-blue border border-white/20 rounded-lg px-3 py-2 text-white text-left"
            >
              <span>{selectedAssignee ? selectedAssignee.fullName : <span className="text-gray-400">Select an assignee</span>}</span>
              <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isAssigneeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAssigneeDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                  <div
                    onClick={() => {
                      field.onChange(null);
                      setAssigneeDropdownOpen(false);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1 text-gray-400"
                  >
                    Unassigned
                  </div>
                {Array.isArray(users) && users.map((user: User) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      field.onChange(user.id);
                      setAssigneeDropdownOpen(false);
                    }}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1"
                  >
                    <span>{user.fullName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      />

        <div className="grid grid-cols-2 gap-4">
            <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                    <div className="relative" ref={priorityDropdownRef}>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                        <button
                          type="button"
                          onClick={() => setPriorityDropdownOpen(!isPriorityDropdownOpen)}
                          className="w-full flex justify-between items-center bg-dark-blue border border-white/20 rounded-lg px-3 py-2 text-white text-left"
                        >
                          <span>{priorityOptions.find(p => p.value === selectedPriority)?.label || 'Select Priority'}</span>
                          <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPriorityDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                            {priorityOptions.map((option) => (
                              <div
                                key={option.value}
                                onClick={() => {
                                  field.onChange(option.value);
                                  setPriorityDropdownOpen(false);
                                }}
                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1"
                              >
                                <span>{option.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                )}
            />
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input type="date" id="dueDate" {...register('dueDate')} className="w-full bg-dark-blue border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue"/>
            </div>
        </div>

       <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onCancel} className="py-2 px-4 bg-white/10 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-neon-pink text-dark-blue font-bold rounded-lg">
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
        </div>
    </form>
  );
};

const CsvImportView = ({ onImportFinished, onCancel }: any) => {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            toast.success(`File "${acceptedFiles[0].name}" selected.`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false,
    });

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadTaskCsvTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tasks-template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error('Failed to download template.');
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file to import.');
            return;
        }
        setIsImporting(true);
        try {
            const result = await importTasksFromCsv(file);
            toast.success(result.message);
            if (result.data.errors && result.data.errors.length > 0) {
                 toast.custom(t => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-dark-blue shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-white/20`}>
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <ExclamationCircleIcon className="h-10 w-10 text-yellow-400"/>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-white">Import Issues</p>
                                    <p className="mt-1 text-sm text-gray-400">
                                        {result.data.errors.length} rows failed. First error: Row {result.data.errors[0].row}, {result.data.errors[0].reason}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ), { duration: 6000 });
            }
            onImportFinished();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to import tasks.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="pt-4 text-white">
            <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Download CSV Template
            </button>

            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-neon-pink bg-neon-pink/10' : 'border-white/30 hover:border-neon-blue'}`}
            >
                <input {...getInputProps()} />
                <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2"/>
                {isDragActive ? (
                    <p>Drop the file here ...</p>
                ) : (
                    <p>Drag 'n' drop a .csv file here, or click to select file</p>
                )}
            </div>
            {file && (
                 <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm flex items-center justify-between">
                    <p className="truncate">Selected: <span className="font-semibold">{file.name}</span></p>
                    <button onClick={() => setFile(null)} className="text-gray-400 hover:text-white"><XMarkIcon className="h-5 w-5"/></button>
                </div>
            )}
            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onCancel} className="py-2 px-4 bg-white/10 rounded-lg">Cancel</button>
                <button 
                    type="button" 
                    onClick={handleImport}
                    disabled={!file || isImporting} 
                    className="py-2 px-4 bg-neon-pink text-dark-blue font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isImporting ? 'Importing...' : 'Start Import'}
                </button>
            </div>
        </div>
    );
};

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onTaskCreated, users, project, initialTab = 'manual' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const onSubmit = async (data: CreateTaskFormValues) => {
    if (!project) {
        toast.error("No project selected!");
        return;
    }
    try {
      // Xử lý dueDate để tránh lỗi date không hợp lệ
      const processedData = {
        ...data,
        projectId: project.id,
        dueDate: data.dueDate && data.dueDate.trim() !== '' ? data.dueDate : null
      };
      
      await createTask(processedData);
      toast.success('Task created successfully!');
      onTaskCreated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task.');
    }
  };

  const handleClose = () => {
      // No need to reset tab here anymore, useEffect handles it
      onClose();
  }
  
  const handleImportSuccess = () => {
      onTaskCreated();
      handleClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-dark-blue border border-white/20 rounded-2xl shadow-lg w-full max-w-2xl p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">New Task for "{project?.name}"</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/20 mb-4">
            <nav className="flex space-x-4" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'manual' ? 'border-b-2 border-neon-pink text-neon-pink' : 'text-gray-400 hover:text-white'}`}
                >
                    Create Manually
                </button>
                <button
                    onClick={() => setActiveTab('csv')}
                    className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'csv' ? 'border-b-2 border-neon-pink text-neon-pink' : 'text-gray-400 hover:text-white'}`}
                >
                    Import from CSV
                </button>
            </nav>
        </div>

        {/* Tab Content */}
        <div>
            {activeTab === 'manual' && <ManualCreateForm project={project} users={users} onFormSubmit={onSubmit} onCancel={handleClose} />}
            {activeTab === 'csv' && <CsvImportView onImportFinished={handleImportSuccess} onCancel={handleClose} />}
        </div>
      </div>
    </div>
  );
}; 