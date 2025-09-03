'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { ViewMode } from '@/types';
import TaskManagementView from '@/components/dashboard/TaskManagementView';
import TeamManagementView from '@/components/dashboard/TeamManagementView';
import ReportsView from '@/components/dashboard/ReportsView';
import KnowledgeBaseView from '@/components/dashboard/KnowledgeBaseView';
import QuizView from '@/components/dashboard/QuizView';
import SettingsView from '@/components/dashboard/SettingsView';
import ProjectManagementView from '@/components/dashboard/ProjectManagementView';
import ProfileView from '@/components/dashboard/ProfileView';
import { TemplateManagementView } from '@/components/dashboard/TemplateManagementView';
import CalendarView from '@/components/dashboard/CalendarView';
import { QueryProvider } from '@/context/QueryProvider';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Set dark mode as default and permanent
    document.documentElement.classList.add('dark');
  }, []);

  // If the auth state is loaded and the user is not authenticated, redirect to login
  useEffect(() => {
    if (state.token === null && !state.isAuthenticated) {
        // A small delay to prevent flickering during initial load
        const timer = setTimeout(() => {
            if (!localStorage.getItem('token')) {
                router.push('/login');
            }
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [state.isAuthenticated, state.token, router]);
  
  // While waiting for auth state to load, we can show a loader
  // This prevents showing the layout to unauthenticated users briefly
  if (!state.isAuthenticated && state.token === null) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <div>Loading...</div>
        </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'projects':
        return <ProjectManagementView />;
      case 'tasks':
        return <TaskManagementView />;
      case 'teams':
        return <TeamManagementView />;
      case 'reports':
        return <ReportsView onNavigate={setCurrentView} />;
      case 'knowledge':
        return <KnowledgeBaseView />;
      case 'quiz':
        return <QuizView />;
      case 'templates':
        return <TemplateManagementView />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      case 'overview':
      default:
        return children;
    }
  };

  return (
    <QueryProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-black via-yellow-900/40 to-red-900/40">
       {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      <Sidebar 
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false); // Close mobile menu on navigation
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        userRoleId={state.user?.role_id}
      />
      <div className="flex-1 flex flex-col md:ml-28">
        <Header onMobileMenuClick={() => setIsMobileMenuOpen(true)} onNavigate={setCurrentView} />
        <main className="flex-1 p-5 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
    </QueryProvider>
  );
};

export default MainLayout; 