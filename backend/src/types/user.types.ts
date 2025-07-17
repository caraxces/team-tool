export interface User {
    id: number;
    uuid: string;
    email: string;
    fullName: string;
    role_id: number;
    avatarUrl: string | null;
}

export interface NewUserInput {
  uuid: string;
  email: string;
  password: string;
  full_name: string;
  role_id: number;
} 