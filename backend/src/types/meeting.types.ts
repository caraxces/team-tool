export interface Meeting {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_type: 'online' | 'offline' | 'hybrid';
  meeting_url?: string;
  organizer_id: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  color: string;
  is_recurring: boolean;
  recurring_pattern?: any;
  created_at: string;
  updated_at: string;
  organizer?: {
    id: number;
    fullName: string;
    email: string;
  };
  participants?: MeetingParticipant[];
}

export interface MeetingParticipant {
  meeting_id: number;
  user_id: number;
  response_status: 'pending' | 'accepted' | 'declined' | 'tentative';
  is_required: boolean;
  joined_at?: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_type: 'online' | 'offline' | 'hybrid';
  meeting_url?: string;
  color?: string;
  is_recurring?: boolean;
  recurring_pattern?: any;
  participant_ids?: number[];
  reminder_minutes?: number[];
}

export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  meeting_type?: 'online' | 'offline' | 'hybrid';
  meeting_url?: string;
  color?: string;
  is_recurring?: boolean;
  recurring_pattern?: any;
  participant_ids?: number[];
}

export interface MeetingFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  meeting_type?: string;
  organizer_id?: number;
}

export interface MeetingReminder {
  id: number;
  meeting_id: number;
  user_id: number;
  reminder_time: string;
  reminder_type: 'email' | 'notification' | 'sms';
  is_sent: boolean;
} 