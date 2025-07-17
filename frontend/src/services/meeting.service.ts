import apiClient from './api';
import { Meeting, CreateMeetingDto } from '@/types/meeting.type';

export const getMeetings = async (params?: {
  start_date?: string;
  end_date?: string;
  status?: string;
  meeting_type?: string;
}): Promise<Meeting[]> => {
  const response = await apiClient.get('/meetings', { params });
  return response.data.data;
};

export const getMyMeetings = async (params?: {
  start_date?: string;
  end_date?: string;
  status?: string;
}): Promise<Meeting[]> => {
  const response = await apiClient.get('/meetings/my-meetings', { params });
  return response.data.data;
};

export const getMeetingById = async (id: number): Promise<Meeting> => {
  const response = await apiClient.get(`/meetings/${id}`);
  return response.data.data;
};

export const createMeeting = async (meetingData: CreateMeetingDto): Promise<Meeting> => {
  const response = await apiClient.post('/meetings', meetingData);
  return response.data.data;
};

export const updateMeeting = async (id: number, meetingData: Partial<CreateMeetingDto>): Promise<Meeting> => {
  const response = await apiClient.put(`/meetings/${id}`, meetingData);
  return response.data.data;
};

export const deleteMeeting = async (id: number): Promise<void> => {
  await apiClient.delete(`/meetings/${id}`);
};

export const updateParticipantResponse = async (meetingId: number, responseStatus: string): Promise<void> => {
  await apiClient.patch(`/meetings/${meetingId}/response`, {
    response_status: responseStatus
  });
}; 