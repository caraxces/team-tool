'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/services/auth.service';

const ResetPasswordForm = () => {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
    const newPassword = watch('newPassword');

    const onSubmit = async (data: any) => {
        try {
            await resetPassword({ token: data.token, newPassword: data.newPassword });
            toast.success('Your password has been reset successfully!');
            router.push('/login');
        } catch (error) {
            toast.error('Invalid or expired code. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <Label htmlFor="token">Security Code</Label>
                <Input
                    id="token"
                    placeholder="Enter the code from your email"
                    {...register('token', { required: 'Security code is required' })}
                />
                {errors.token && <p className="text-red-500 text-xs mt-1">{errors.token.message as string}</p>}
            </div>
             <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword', { 
                        required: 'New password is required', 
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                    })}
                />
                {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message as string}</p>}
            </div>
            <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword', {
                        required: 'Please confirm your new password',
                        validate: value => value === newPassword || 'Passwords do not match'
                    })}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message as string}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
        </form>
    );
};

export default ResetPasswordForm; 