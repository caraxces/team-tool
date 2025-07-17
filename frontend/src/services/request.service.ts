import api from './api';

// --- Types ---
export interface LeaveRequest {
    id: number;
    user_id: number;
    request_type: 'LEAVE' | 'OUT_OF_OFFICE';
    start_date: string;
    end_date: string;
    reason: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

export interface PaymentRequest {
    id: number;
    user_id: number;
    amount: number;
    currency: string;
    description: string;
    receipt_url: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

export type NewLeaveRequestData = Omit<LeaveRequest, 'id' | 'user_id' | 'status' | 'created_at'>;
// Simplified to not include file upload logic
export type NewPaymentRequestData = Omit<PaymentRequest, 'id' | 'user_id' | 'status' | 'created_at'>;


// --- API Functions ---

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const { data } = await api.get('/requests/leave');
    return data.data;
};

export const createLeaveRequest = async (requestData: NewLeaveRequestData): Promise<LeaveRequest> => {
    const { data } = await api.post('/requests/leave', requestData);
    return data.data;
};

export const getPaymentRequests = async (): Promise<PaymentRequest[]> => {
    const { data } = await api.get('/requests/payment');
    return data.data;
};

export const createPaymentRequest = async (requestData: NewPaymentRequestData): Promise<PaymentRequest> => {
    // Sends a simple JSON object now
    const { data } = await api.post('/requests/payment', requestData);
    return data.data;
}; 