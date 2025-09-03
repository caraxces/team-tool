'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Menu, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ViewMode } from '@/types';
import { NotificationBell } from './NotificationBell'; // Import the new component
import api from '@/services/api';

interface HeaderProps {
  onMobileMenuClick: () => void;
  onNavigate: (view: ViewMode) => void;
}

const Header = ({ onMobileMenuClick, onNavigate }: HeaderProps) => {
  const { state, dispatch } = useAuth();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="relative z-30 flex-shrink-0 h-20 bg-transparent backdrop-blur-lg flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onMobileMenuClick}
          className="md:hidden p-2 rounded-full text-gray-400 hover:bg-gray-800"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>
      <div className="flex items-center space-x-5">
        <NotificationBell />
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-colors"
          >
            {state.user?.avatarUrl ? (
                <img 
                    src={`${api.defaults.baseURL}${state.user.avatarUrl}?t=${new Date().getTime()}`} 
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full object-cover bg-gray-700" 
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {state.user?.fullName?.[0]?.toUpperCase() || <User size={18} />}
                </div>
            )}
            <span className="hidden md:inline text-sm font-medium text-gray-800 dark:text-gray-200">{state.user?.fullName}</span>
            <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 pt-2 z-40 w-48">
              <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg border border-white/10 dark:border-gray-700/60 rounded-md shadow-2xl py-1">
                <button
                  onClick={() => { onNavigate('profile'); setProfileMenuOpen(false); }}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/80"
                >
                  Hồ sơ
                </button>
                <button
                  onClick={() => { onNavigate('settings'); setProfileMenuOpen(false); }}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/80"
                >
                  Cài đặt
                </button>
                <div className="border-t border-gray-200/80 dark:border-gray-700/60 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 