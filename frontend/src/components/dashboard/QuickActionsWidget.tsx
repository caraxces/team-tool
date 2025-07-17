import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bolt, 
  PlusCircle, 
  FolderPlus, 
  UserPlus,
  CalendarClock,
  UserCog,
  MailQuestion,
  ClipboardPlus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AssignRoleModal } from './AssignRoleModal';
import { GenerateFromTemplateModal } from './GenerateFromTemplateModal';
import { generateFromTemplate } from '@/services/template.service';
import { useQueryClient } from '@tanstack/react-query';


type ActionView = 'tasks' | 'projects' | 'team';

interface QuickActionsWidgetProps {
    onNavigate: (view: ActionView) => void;
    onAttendanceClick: () => void;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ onNavigate, onAttendanceClick }) => {
    const { state: authState } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const isAdmin = authState.user?.role_id === 1;
    const isManager = authState.user?.role_id === 2 || authState.user?.role_id === 4;
    const [isAssignRoleModalOpen, setAssignRoleModalOpen] = useState(false);
    const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);

    const actions = [
      { name: 'Tạo Task', icon: PlusCircle, onClick: () => onNavigate('tasks') },
      { name: 'Tạo Dự án', icon: FolderPlus, onClick: () => onNavigate('projects') },
    ];
    
    if (isAdmin || isManager) {
        actions.push({ name: 'Tạo từ Template', icon: ClipboardPlus, onClick: () => setGenerateModalOpen(true) });
    }

    if (isAdmin) {
      actions.push({ name: 'Thêm Thành viên', icon: UserPlus, onClick: () => onNavigate('team') });
      actions.push({ name: 'Phân quyền', icon: UserCog, onClick: () => setAssignRoleModalOpen(true) });
    } else {
      actions.push({ name: 'Approval', icon: MailQuestion, onClick: () => router.push('/approvals') });
    }

    return (
        <>
            <div className="bg-gray-800/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
                <div className="flex items-center mb-6">
                    <Bolt className="h-7 w-7 text-violet-400 mr-3" />
                    <h2 className="text-xl font-bold">Tác vụ nhanh</h2>
                </div>
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                    {actions.map((action) => (
                        <button
                            key={action.name}
                            onClick={action.onClick}
                            className="flex flex-row items-center justify-start sm:flex-col sm:justify-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <action.icon className="h-8 w-8 mr-4 sm:mr-0 sm:mb-2" />
                            <span className="text-sm font-semibold">{action.name}</span>
                        </button>
                    ))}
                    <button
                        key="attendance"
                        onClick={onAttendanceClick}
                        className="flex flex-row items-center justify-start sm:flex-col sm:justify-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <CalendarClock className="h-8 w-8 mr-4 sm:mr-0 sm:mb-2" />
                        <span className="text-sm font-semibold">Chấm công</span>
                    </button>
                </div>
            </div>
            {isAdmin && (
                <AssignRoleModal
                    isOpen={isAssignRoleModalOpen}
                    onClose={() => setAssignRoleModalOpen(false)}
                />
            )}
            {(isAdmin || isManager) && (
                <GenerateFromTemplateModal
                    isOpen={isGenerateModalOpen}
                    onClose={() => setGenerateModalOpen(false)}
                    onSubmit={generateFromTemplate}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['projects'] });
                        // You might want to invalidate other queries like tasks as well
                    }}
                />
            )}
        </>
    );
};

export default QuickActionsWidget; 