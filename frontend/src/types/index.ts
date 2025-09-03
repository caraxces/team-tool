export type ViewMode = 
  | 'overview' 
  | 'projects' 
  | 'tasks' 
  | 'teams' 
  | 'reports' 
  | 'knowledge' 
  | 'quiz'
  | 'templates'
  | 'settings' 
  | 'profile'
  | 'calendar'; 

export interface User {
  id: number;
  uuid: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role_id: number;
  created_at: string;
  updated_at: string;
} 