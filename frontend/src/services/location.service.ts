import api from './api';

export interface WorkLocation {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
}

export type NewLocationData = Omit<WorkLocation, 'id'>;
export type UpdateLocationData = Partial<NewLocationData>;

export const getLocations = async (): Promise<WorkLocation[]> => {
    const { data } = await api.get('/work-locations');
    return data.data;
};

export const createLocation = async (locationData: NewLocationData): Promise<WorkLocation> => {
    const { data } = await api.post('/work-locations', locationData);
    return data.data;
};

export const updateLocation = async (id: number, locationData: UpdateLocationData): Promise<WorkLocation> => {
    const { data } = await api.put(`/work-locations/${id}`, locationData);
    return data.data;
};

export const deleteLocation = async (id: number): Promise<void> => {
    await api.delete(`/work-locations/${id}`);
}; 