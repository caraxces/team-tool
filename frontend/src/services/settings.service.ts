import api from './api';

export interface GA4SettingsData {
    team_id: number;
    ga4_property_id: string;
    measurement_id?: string;
    api_secret?: string;
    service_account_file?: File;
}

export const saveGA4Settings = async (settings: GA4SettingsData) => {
    const formData = new FormData();
    formData.append('team_id', settings.team_id.toString());
    formData.append('ga4_property_id', settings.ga4_property_id);
    if (settings.measurement_id) formData.append('measurement_id', settings.measurement_id);
    if (settings.api_secret) formData.append('api_secret', settings.api_secret);
    if (settings.service_account_file) {
        formData.append('service_account_file', settings.service_account_file);
    }
    
    const { data } = await api.post('/settings/ga4', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

export const getGA4Settings = async (teamId: number) => {
    const { data } = await api.get(`/settings/ga4?team_id=${teamId}`);
    return data;
}; 