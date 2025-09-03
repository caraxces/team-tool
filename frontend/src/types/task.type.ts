import { User } from "./user.type";

export interface Task {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  assignee: User | null;
  assigneeId: number | null;
  projectId: number;
  subtasks: Task[];
  // from BE
  project_name?: string;
}

export interface CreateTaskPayload {
    projectId: number;
    title: string;
    description?: string | null;
    assigneeId?: number | null;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string | null;
    status?: 'todo' | 'in_progress' | 'in_review' | 'done';
} 