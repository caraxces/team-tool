import pool from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// --- LEAVE / OUT OF OFFICE ---

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

export const createLeaveRequest = async (userId: number, data: Omit<LeaveRequest, 'id' | 'user_id' | 'status' | 'created_at'>): Promise<LeaveRequest> => {
    const { request_type, start_date, end_date, reason } = data;
    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO leave_requests (user_id, request_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
        [userId, request_type, start_date, end_date, reason]
    );
    const [newRequest] = await pool.query<RowDataPacket[]>('SELECT * FROM leave_requests WHERE id = ?', [result.insertId]);
    return newRequest[0] as LeaveRequest;
};

export const getLeaveRequestsByUserId = async (userId: number): Promise<LeaveRequest[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows as LeaveRequest[];
};


// --- PAYMENT REQUESTS ---

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

export const createPaymentRequest = async (userId: number, data: Omit<PaymentRequest, 'id' | 'user_id' | 'status' | 'created_at' | 'currency'> & { currency?: string; receipt_url?: string }): Promise<PaymentRequest> => {
    const { amount, description, receipt_url, currency } = data;
    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO payment_requests (user_id, amount, description, receipt_url, currency) VALUES (?, ?, ?, ?, ?)',
        [userId, amount, description, receipt_url || null, currency || 'VND']
    );
    const [newRequest] = await pool.query<RowDataPacket[]>('SELECT * FROM payment_requests WHERE id = ?', [result.insertId]);
    return newRequest[0] as PaymentRequest;
};

export const getPaymentRequestsByUserId = async (userId: number): Promise<PaymentRequest[]> => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM payment_requests WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows as PaymentRequest[];
}; 