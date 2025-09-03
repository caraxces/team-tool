import api from './api';

export interface AttendanceRecord {
    id: number;
    user_id: number;
    full_name: string;
    date: string;
    clock_in_time: string | null;
    clock_out_time: string | null;
    status: 'ON_TIME' | 'LATE' | 'OUT_OF_RANGE';
}

interface ApiResponse<T> {
    message: string;
    data: T;
}

export const getAttendanceStatus = async (): Promise<ApiResponse<AttendanceRecord | null>> => {
    const response = await api.get<ApiResponse<AttendanceRecord | null>>('/attendance/status');
    return response.data;
};

export const clockIn = async (latitude: number, longitude: number): Promise<ApiResponse<AttendanceRecord>> => {
    const response = await api.post<ApiResponse<AttendanceRecord>>('/attendance/clock-in', { latitude, longitude });
    return response.data;
};

export const clockOut = async (): Promise<ApiResponse<AttendanceRecord>> => {
    const response = await api.post<ApiResponse<AttendanceRecord>>('/attendance/clock-out');
    return response.data;
};

export const getAllAttendance = async (): Promise<AttendanceRecord[]> => {
    const { data } = await api.get('/attendance/all');
    return data.data;
};

export const updateAttendance = async (id: number, updateData: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const { data } = await api.put(`/attendance/${id}`, updateData);
    return data.data;
};

export const exportAttendanceCsv = async (): Promise<Blob> => {
    const response = await api.get('/attendance/export', {
        responseType: 'blob', // Important for file downloads
    });
    return response.data;
}; 