export interface Message {
    id: number;
    uuid: string;
    content: string;
    createdAt: string;
    sender: {
        id: number;
        fullName: string;
        avatarUrl: string | null;
    }
} 