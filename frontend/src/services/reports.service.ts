import api from './api';

export const getGA4Report = async (teamId: number, startDate: string, endDate: string) => {
    const params = new URLSearchParams({
        team_id: teamId.toString(),
        startDate,
        endDate
    });

    const { data } = await api.get(`/reports/ga4?${params.toString()}`);
    return data.data; // Assuming the backend wraps the data in a 'data' object
}; 