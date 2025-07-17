import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { updateProject } from '@/services/project.service';
import { Project } from '@/types/project.type';
import { User } from '@/types/user.type';

const editProjectFormSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters.'),
  description: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed']),
  picId: z.coerce.number().optional().nullable(),
  memberIds: z.array(z.coerce.number()).optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectFormSchema>;
type StatusEnum = EditProjectFormValues['status'];

const statusOptions: { value: StatusEnum; label: string }[] = [
    { value: 'planning', label: 'Planning' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
];

const mapProjectStatusToFormStatus = (status: Project['status']): StatusEnum => {
    switch (status) {
        case 'Planning': return 'planning';
        case 'On Track': return 'in_progress';
        case 'At Risk': return 'on_hold';
        case 'Completed': return 'completed';
        default: return 'planning';
    }
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  project: Project | null;
  users: User[];
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, onProjectUpdated, project, users }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectFormSchema),
    defaultValues: {
        memberIds: [],
        picId: null,
    }
  });
  
  const [isPicDropdownOpen, setPicDropdownOpen] = useState(false);
  const picDropdownRef = useRef<HTMLDivElement>(null);
  const [isMembersDropdownOpen, setMembersDropdownOpen] = useState(false);
  const membersDropdownRef = useRef<HTMLDivElement>(null);
  const [isStatusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const selectedPicId = watch('picId');
  const selectedPic = users.find(u => u.id === selectedPicId);
  const selectedMemberIds = watch('memberIds') || [];
  const selectedMembers = users.filter(u => selectedMemberIds.includes(u.id));
  const selectedStatus = watch('status');


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (picDropdownRef.current && !picDropdownRef.current.contains(event.target as Node)) {
        setPicDropdownOpen(false);
      }
      if (membersDropdownRef.current && !membersDropdownRef.current.contains(event.target as Node)) {
        setMembersDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (project) {
        const deadlineDate = project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '';
        reset({
            name: project.name,
            description: project.description || '',
            endDate: deadlineDate,
            status: mapProjectStatusToFormStatus(project.status),
            picId: project.pic?.id,
            memberIds: project.members.map(m => m.id)
        });
    }
  }, [project, reset]);

  const onSubmit = async (data: EditProjectFormValues) => {
    if (!project) return;
    try {
      await updateProject(project.id, data);
      toast.success('Project updated successfully!');
      onProjectUpdated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update project.');
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-dark-blue border border-white/20 rounded-2xl shadow-lg w-full max-w-lg p-6 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Project: {project.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-white">
          
           <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
            <input id="name" {...register('name')} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue"/>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea id="description" {...register('description')} rows={3} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                <input type="date" id="endDate" {...register('endDate')} className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue" />
            </div>
             <Controller
                name="status"
                control={control}
                render={({ field }) => (
                <div className="relative" ref={statusDropdownRef}>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <button type="button" onClick={() => setStatusDropdownOpen(!isStatusDropdownOpen)} className="w-full flex justify-between items-center bg-dark-blue border border-white/20 rounded-lg px-3 py-2 text-white text-left">
                        <span>{statusOptions.find(s => s.value === selectedStatus)?.label || 'Select Status'}</span>
                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isStatusDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                        {statusOptions.map(option => (
                        <div key={option.value} onClick={() => { field.onChange(option.value); setStatusDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                            {option.label}
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                )}
            />
          </div>

          {/* PIC Custom Dropdown */}
          <Controller
            name="picId"
            control={control}
            render={({ field }) => (
              <div className="relative" ref={picDropdownRef}>
                <label className="block text-sm font-medium text-gray-300 mb-1">Person In Charge (PIC)</label>
                <button type="button" onClick={() => setPicDropdownOpen(!isPicDropdownOpen)} className="w-full flex justify-between items-center bg-dark-blue border border-white/20 rounded-lg px-3 py-2 text-white text-left">
                  <span>{selectedPic ? selectedPic.fullName : <span className="text-gray-400">Select a PIC</span>}</span>
                  <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isPicDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPicDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                    {users.map(user => (
                      <div key={user.id} onClick={() => { field.onChange(user.id); setPicDropdownOpen(false); }} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                        {user.fullName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          />

          {/* Members Custom Multi-Select Dropdown */}
          <Controller
            name="memberIds"
            control={control}
            render={({ field }) => (
              <div className="relative" ref={membersDropdownRef}>
                <label className="block text-sm font-medium text-gray-300 mb-1">Members</label>
                <div className="w-full bg-dark-blue border border-white/20 rounded-lg p-2">
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
                      {selectedMembers.map(member => (
                          <span key={`member-${member.id}`} className="bg-neon-blue/20 text-neon-blue text-xs font-medium px-2 py-1 rounded-full flex items-center">
                            {member.fullName}
                            <button type="button" onClick={(e) => { e.stopPropagation(); const newIds = selectedMemberIds.filter(id => id !== member.id); field.onChange(newIds); }} className="ml-1.5 text-neon-blue/70 hover:text-neon-blue">
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                      ))}
                  </div>
                  <button type="button" onClick={() => setMembersDropdownOpen(!isMembersDropdownOpen)} className="w-full flex justify-between items-center text-left">
                      <span className="text-gray-400">Select members...</span>
                      <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isMembersDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {isMembersDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-dark-blue/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                    {users.map(user => {
                        const isSelected = selectedMemberIds.includes(user.id);
                        return (
                        <div key={user.id} onClick={() => {
                            const newIds = isSelected ? selectedMemberIds.filter(id => id !== user.id) : [...selectedMemberIds, user.id];
                            field.onChange(newIds);
                        }} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100/10 transition-colors cursor-pointer mx-1 my-1">
                            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${isSelected ? 'bg-neon-blue border-neon-blue' : 'border-gray-400'}`}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                            </div>
                            <span>{user.fullName}</span>
                        </div>
                        );
                    })}
                  </div>
                )}
              </div>
            )}
          />
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-neon-blue text-dark-blue font-bold rounded-lg shadow-neon-blue hover:scale-105 transition-transform disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 