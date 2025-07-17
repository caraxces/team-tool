'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createLeaveRequest, NewLeaveRequestData } from '@/services/request.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface LeaveRequestFormProps {
    onSuccess: () => void;
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSuccess }) => {
    const [requestType, setRequestType] = useState<'LEAVE' | 'OUT_OF_OFFICE'>('LEAVE');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const mutation = useMutation({
        mutationFn: (newData: NewLeaveRequestData) => createLeaveRequest(newData),
        onSuccess: () => {
            // TODO: Add success notification (toast)
            console.log('Leave request created successfully!');
            setStartDate('');
            setEndDate('');
            setReason('');
            onSuccess();
        },
        onError: (error) => {
            // TODO: Add error notification (toast)
            console.error('Failed to create leave request:', error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            request_type: requestType,
            start_date: startDate,
            end_date: endDate,
            reason: reason,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label>Loại yêu cầu</Label>
                <div className="flex items-center space-x-4 mt-2">
                    <button type="button" 
                        onClick={() => setRequestType('LEAVE')} 
                        className={`px-6 py-2 rounded-lg transition-all duration-300 border ${
                            requestType === 'LEAVE' 
                            ? 'bg-violet-600/80 border-violet-500 text-white font-bold shadow-lg' 
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }`}
                    >
                        Nghỉ phép
                    </button>
                    <button type="button" 
                        onClick={() => setRequestType('OUT_OF_OFFICE')} 
                        className={`px-6 py-2 rounded-lg transition-all duration-300 border ${
                            requestType === 'OUT_OF_OFFICE' 
                            ? 'bg-violet-600/80 border-violet-500 text-white font-bold shadow-lg' 
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }`}
                    >
                        Ngoài văn phòng
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start_date">Ngày bắt đầu</Label>
                    <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="end_date">Ngày kết thúc</Label>
                    <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
            </div>

            <div>
                <Label htmlFor="reason">Lý do</Label>
                <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2 mt-1 focus:ring-violet-500 focus:border-violet-500"
                    rows={4}
                />
            </div>

            <div className="text-right">
                <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-violet-600/30 text-white font-bold border border-violet-500/50 backdrop-blur-xl hover:bg-violet-600/50 shadow-lg transition-all duration-300"
                >
                    {mutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Button>
            </div>
        </form>
    );
}; 