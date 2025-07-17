'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { forgotPassword } from '@/services/auth.service';

interface ForgotPasswordFormValues {
    email: string;
}

const ForgotPasswordForm = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>();

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        try {
            await forgotPassword(data.email);
            toast.success('If an account with this email exists, a reset link has been sent.');
            setIsSubmitted(true);
        } catch (error) {
            toast.error('An unexpected error occurred. Please try again.');
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center">
                <h2 className="text-xl font-semibold">Check your email</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    A password reset link has been sent to your email address. Please follow the instructions in the email to reset your password.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
        </form>
    );
};

export default ForgotPasswordForm; 