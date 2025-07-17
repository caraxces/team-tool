'use client';

import {
  Home,
  FolderKanban,
  ListTodo,
  Users,
  Calendar,
  LineChart,
  Cog,
  BookOpen,
  ClipboardCheck,
  FileText, // For Templates
  X,
  LifeBuoy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewMode } from '@/types';
import { TeamToolLogo } from '@/components/ui/logo';
import { useMemo } from 'react';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  userRoleId?: number;
}

const baseNavItems = [
  { icon: Home, label: 'Tổng quan', view: 'overview' as ViewMode },
  { icon: FolderKanban, label: 'Dự án', view: 'projects' as ViewMode },
  { icon: ListTodo, label: 'Nhiệm vụ', view: 'tasks' as ViewMode },
  { icon: Users, label: 'Đội nhóm', view: 'teams' as ViewMode },
  { icon: Calendar, label: 'Lịch họp', view: 'calendar' as ViewMode },
  { icon: LineChart, label: 'Báo cáo', view: 'reports' as ViewMode },
  { icon: BookOpen, label: 'Knowledge Base', view: 'knowledge' as ViewMode },
  { icon: ClipboardCheck, label: 'Quiz', view: 'quiz' as ViewMode },
];

const adminNavItem = { icon: FileText, label: 'Templates', view: 'templates' as ViewMode };

const bottomNavItems = [
    { icon: Cog, label: 'Cài đặt', view: 'settings' as ViewMode },
];

const Sidebar = ({ currentView, onNavigate, isMobileMenuOpen, setIsMobileMenuOpen, userRoleId }: SidebarProps) => {

  const mainNavItems = useMemo(() => {
    if (userRoleId === 1) {
      // Insert Templates nav item after Projects for admins
      const projectsIndex = baseNavItems.findIndex(item => item.view === 'projects');
      const newNav = [...baseNavItems];
      newNav.splice(projectsIndex + 1, 0, adminNavItem);
      return newNav;
    }
    return baseNavItems;
  }, [userRoleId]);

  const NavButton = ({ item, isSelected, onClick }: { item: { icon: React.ElementType, label: string }, isSelected: boolean, onClick: () => void }) => (
    <li className="relative">
      <button
        onClick={onClick}
        className="relative z-10 flex items-center justify-center w-12 h-12 rounded-lg text-gray-300 transition-colors duration-200 hover:bg-white/10"
        title={item.label}
      >
        <item.icon size={22} />
      </button>
      {isSelected && (
        <motion.div
          layoutId="selected-nav-indicator"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-400/70 to-red-500/70 shadow-lg shadow-red-500/10"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </li>
  );
  
  return (
    <div className={`fixed top-0 left-0 h-full flex items-center z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="m-0 md:m-4 p-px rounded-r-3xl md:rounded-3xl bg-gradient-to-b from-yellow-300/20 via-orange-400/20 to-red-500/20 h-full md:h-auto">
        <div className="relative flex flex-col items-center bg-black/20 backdrop-blur-2xl rounded-r-[calc(1.875rem-1px)] md:rounded-[calc(1.875rem-1px)] py-6 px-2 space-y-8 h-full">
            <div className="absolute top-4 right-4 md:hidden">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400">
                    <X size={24} />
                </button>
            </div>
            <div className="mb-4 mt-8 md:mt-0">
                <TeamToolLogo />
            </div>

            <nav className="flex-1 flex flex-col items-center">
                <ul className="space-y-4">
                    {mainNavItems.map((item) => (
                        <NavButton
                            key={item.view}
                            item={item}
                            isSelected={currentView === item.view}
                            onClick={() => onNavigate(item.view)}
                        />
                    ))}
                </ul>
            </nav>

            <div className="flex flex-col items-center space-y-4">
                <ul className="space-y-4">
                    {bottomNavItems.map((item) => (
                        <NavButton
                            key={item.view}
                            item={item}
                            isSelected={currentView === item.view}
                            onClick={() => onNavigate(item.view)}
                        />
                    ))}
                </ul>
                <a
                    href="mailto:larisa.trucmt@gmail.com"
                    title="Contact Support"
                    className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden cursor-pointer transition-transform hover:scale-110 bg-gray-700 text-gray-300 hover:bg-violet-500 hover:text-white"
                >
                    <LifeBuoy size={24} />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 