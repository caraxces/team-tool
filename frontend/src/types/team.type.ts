import { User } from './user.type';

export interface Team {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    members?: User[]; // Optional: will be added later
} 