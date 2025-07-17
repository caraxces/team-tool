import api from './api';
import { Team } from '@/types/team.type';
import { User } from '@/types/user.type';

export const getMyTeams = async (): Promise<Team[]> => {
    const { data } = await api.get('/teams');
    return data.data.teams;
};

export const createTeam = async (teamData: {name: string, description?: string}): Promise<Team> => {
    const { data } = await api.post('/teams', teamData);
    return data.data.team;
};

export const getTeamMembers = async (teamId: number): Promise<User[]> => {
    const { data } = await api.get(`/teams/${teamId}/members`);
    return data.data.members;
};

export const inviteMember = async (teamId: number, userId: number) => {
    const { data } = await api.post(`/teams/${teamId}/members`, { userId });
    return data;
};

export const downloadMemberCsvTemplate = async (teamId: number) => {
    const response = await api.get(`/teams/${teamId}/members/csv-template`, {
        responseType: 'blob',
    });
    return response.data;
};

export const importMembersFromCsv = async (teamId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post(`/teams/${teamId}/members/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
}; 