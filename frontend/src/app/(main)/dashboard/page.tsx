'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '@/services/user.service'; // Import the service
import ProjectOverviewWidget from '@/components/dashboard/ProjectOverviewWidget';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';
import ProgressWidget from '@/components/dashboard/ProgressWidget';
import TasksWidget from '@/components/dashboard/TasksWidget';
import TeamMembersWidget from '@/components/dashboard/TeamMembersWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import { CreateTaskModal } from '@/components/dashboard/CreateTaskModal';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';
import { ChooseCreateModeModal } from '@/components/dashboard/ChooseCreateModeModal';
import { AttendanceModal } from '@/components/dashboard/AttendanceModal';
// Dummy data for modals - replace with actual data fetching
import { User } from '@/types/user.type';
import { Project } from '@/types/project.type';


const DashboardContent = () => {
  const [isChooseModeOpen, setChooseModeOpen] = useState(false);
  const [chooseModeItemType, setChooseModeItemType] = useState<'task' | 'project'>('task');

  const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [taskModalInitialTab, setTaskModalInitialTab] = useState<'manual' | 'csv'>('manual');
  
  const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [projectModalInitialTab, setProjectModalInitialTab] = useState<'manual' | 'csv'>('manual');
  
  const [isAttendanceModalOpen, setAttendanceModalOpen] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        // The API seems to return an object { data: { users: [] } }, let's safely access it
        setUsers(fetchedUsers.data.users || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleNavigation = (view: 'tasks' | 'projects' | 'team') => {
    if (view === 'tasks' || view === 'projects') {
      setChooseModeItemType(view === 'tasks' ? 'task' : 'project');
      setChooseModeOpen(true);
    } else {
        console.log(`Navigating to ${view}`);
    }
  };

  const handleSelectCreateMode = (mode: 'manual' | 'csv') => {
    if (chooseModeItemType === 'task') {
        setTaskModalInitialTab(mode);
        setCreateTaskModalOpen(true);
    } else if (chooseModeItemType === 'project') {
        setProjectModalInitialTab(mode);
        setCreateProjectModalOpen(true);
    }
  };
  
  const handleTaskCreated = () => { console.log("Task created, refresh data."); };
  const handleProjectCreated = () => { console.log("Project created, refresh data."); };


  return (
    <>
      {/* Mobile Layout: Stacked vertically with QuickActions first */}
      <div className="flex flex-col gap-6 lg:hidden">
        <QuickActionsWidget onNavigate={handleNavigation} onAttendanceClick={() => setAttendanceModalOpen(true)} />
        <ProjectOverviewWidget />
        <ProgressWidget />
        <TasksWidget onNavigateToTasks={() => {}} />
        <TeamMembersWidget members={users} onInvite={() => {}} />
        <RecentActivityWidget />
      </div>

      {/* Desktop Layout: Original Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <ProjectOverviewWidget />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <QuickActionsWidget onNavigate={handleNavigation} onAttendanceClick={() => setAttendanceModalOpen(true)} />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <ProgressWidget />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <TasksWidget onNavigateToTasks={() => {}} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <TeamMembersWidget members={users} onInvite={() => {}} />
        </div>
        <div className="col-span-12">
          <RecentActivityWidget />
        </div>
      </div>
      
      <ChooseCreateModeModal
        isOpen={isChooseModeOpen}
        onClose={() => setChooseModeOpen(false)}
        onSelectMode={handleSelectCreateMode}
        itemType={chooseModeItemType}
      />

      <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setCreateTaskModalOpen(false)}
          onTaskCreated={handleTaskCreated}
          users={users} 
          project={currentProject}
          initialTab={taskModalInitialTab}
      />
      
      <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setCreateProjectModalOpen(false)}
          onProjectCreated={handleProjectCreated}
          users={users}
          initialTab={projectModalInitialTab}
      />

      <AttendanceModal 
        isOpen={isAttendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
      />
    </>
  );
};

export default function DashboardPage() {
    return <DashboardContent />;
} 