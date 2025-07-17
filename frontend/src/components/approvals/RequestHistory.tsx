'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeaveRequests, getPaymentRequests, LeaveRequest, PaymentRequest } from '@/services/request.service';
import { Briefcase, HandCoins, Calendar, CircleHelp, CircleCheck, CircleX } from 'lucide-react';

const StatusBadge = ({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => {
    const statusMap = {
        PENDING: { text: 'Đang chờ', icon: CircleHelp, color: 'text-yellow-400' },
        APPROVED: { text: 'Chấp thuận', icon: CircleCheck, color: 'text-green-400' },
        REJECTED: { text: 'Từ chối', icon: CircleX, color: 'text-red-400' },
    };
    const { text, icon: Icon, color } = statusMap[status];
    return (
        <div className={`flex items-center text-sm font-semibold ${color}`}>
            <Icon className="h-4 w-4 mr-2" />
            {text}
        </div>
    );
};


export const RequestHistory = ({ refreshKey }: { refreshKey: number }) => {
    const { data: leaveData, isLoading: isLoadingLeave, error: errorLeave } = useQuery({
        queryKey: ['leaveRequests', refreshKey],
        queryFn: getLeaveRequests,
    });

    const { data: paymentData, isLoading: isLoadingPayment, error: errorPayment } = useQuery({
        queryKey: ['paymentRequests', refreshKey],
        queryFn: getPaymentRequests,
    });
    
    const combinedData = [
        ...(leaveData || []).map(r => ({ ...r, type: 'leave' })),
        ...(paymentData || []).map(r => ({ ...r, type: 'payment' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (isLoadingLeave || isLoadingPayment) {
        return <div className="text-center text-gray-400">Đang tải lịch sử...</div>;
    }

    if (errorLeave || errorPayment) {
        return <div className="text-center text-red-500">Không thể tải dữ liệu. Vui lòng thử lại.</div>;
    }

    if (!combinedData || combinedData.length === 0) {
        return <div className="text-center text-gray-500">Chưa có yêu cầu nào được tạo.</div>;
    }

    return (
        <div className="space-y-4">
            {combinedData.map(request => (
                <div key={`${request.type}-${request.id}`} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center">
                        {request.type === 'leave' ? <Briefcase className="h-8 w-8 text-sky-400 mr-4" /> : <HandCoins className="h-8 w-8 text-amber-400 mr-4" />}
                        <div>
                            <p className="font-bold text-white">
                                {request.type === 'leave' 
                                    ? `Xin nghỉ (${(request as LeaveRequest).request_type === 'LEAVE' ? 'Nghỉ phép' : 'Ngoài VP'})`
                                    : `Thanh toán (${(request as PaymentRequest).amount.toLocaleString('vi-VN')} VND)`
                                }
                            </p>
                            <p className="text-sm text-gray-400 flex items-center mt-1">
                                <Calendar className="h-4 w-4 mr-2"/>
                                Gửi lúc: {new Date(request.created_at).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    </div>
                    <StatusBadge status={request.status} />
                </div>
            ))}
        </div>
    );
}; 