'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createPaymentRequest, NewPaymentRequestData } from '@/services/request.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface PaymentRequestFormProps {
    onSuccess: () => void;
}

export const PaymentRequestForm: React.FC<PaymentRequestFormProps> = ({ onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');

    const mutation = useMutation({
        mutationFn: (newData: NewPaymentRequestData) => createPaymentRequest(newData),
        onSuccess: () => {
            console.log('Payment request created successfully!');
            setAmount('');
            setDescription('');
            setReceiptUrl('');
            onSuccess();
        },
        onError: (error) => {
            console.error('Failed to create payment request:', error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            amount: Number(amount),
            description: description,
            receipt_url: receiptUrl || null,
            currency: 'VND', // Default currency
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="amount">Số tiền (VND)</Label>
                    <Input 
                        id="amount" 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        required 
                        placeholder="VD: 500000"
                    />
                </div>
                <div>
                    <Label htmlFor="receipt_url">URL Biên lai (Tùy chọn)</Label>
                    <Input 
                        id="receipt_url" 
                        type="text" 
                        value={receiptUrl} 
                        onChange={(e) => setReceiptUrl(e.target.value)}
                        placeholder="https://example.com/receipt.jpg"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="description">Mô tả</Label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2 mt-1 focus:ring-violet-500 focus:border-violet-500"
                    rows={4}
                    required
                    placeholder="VD: Chi phí ăn trưa cùng khách hàng"
                />
            </div>

            <div className="text-right">
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Button>
            </div>
        </form>
    );
}; 