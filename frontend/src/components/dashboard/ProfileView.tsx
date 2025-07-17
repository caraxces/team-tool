'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserCircle, Lock, Edit3, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateMyProfile, uploadAvatar } from '@/services/user.service';
import { requestPasswordChange, changePassword } from '@/services/auth.service';

type PasswordFormStep = 'request' | 'confirm';

const ProfileView = () => {
    const { state: authState, dispatch } = useAuth();
    const [passwordStep, setPasswordStep] = useState<PasswordFormStep>('request');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { register: registerInfo, handleSubmit: handleSubmitInfo, formState: { isSubmitting: isInfoSubmitting } } = useForm({
        defaultValues: {
            fullName: authState.user?.fullName || ''
        }
    });

    const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { isSubmitting: isPasswordSubmitting }, watch } = useForm();
    const newPassword = watch('newPassword');
    
    const onInfoSubmit = async (data: { fullName: string }) => {
        const toastId = toast.loading("Updating profile...");
        try {
            const updatedUser = await updateMyProfile(data);
            dispatch({ type: 'UPDATE_USER', payload: { user: updatedUser } });
            toast.success("Profile updated successfully!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile.", { id: toastId });
        }
    };
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading("Uploading new avatar...");

        try {
            const updatedUser = await uploadAvatar(file);
            dispatch({ type: 'UPDATE_USER', payload: { user: updatedUser } });
            toast.success("Avatar updated successfully!", { id: toastId });
        } catch (error) {
            toast.error("Failed to upload avatar. Please try again.", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const onRequestCode = async () => {
        const toastId = toast.loading("Sending security code...");
        try {
            await requestPasswordChange();
            toast.success("Security code sent to your email.", { id: toastId });
            setPasswordStep('confirm');
        } catch (error) {
            toast.error("Failed to send code. Please try again.", { id: toastId });
        }
    };

    const onPasswordSubmit = async (data: any) => {
        const toastId = toast.loading("Changing password...");
        try {
            await changePassword({ token: data.token, newPassword: data.newPassword });
            toast.success("Password changed successfully!", { id: toastId });
            setPasswordStep('request'); // Reset form
        } catch (error) {
            toast.error("Invalid code or password. Please try again.", { id: toastId });
        }
    };

    const avatarUrl = authState.user?.avatarUrl ? `http://localhost:3001${authState.user.avatarUrl}?t=${new Date().getTime()}` : null;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-white">
            <div className="flex items-center mb-8">
                <div className="relative mr-6">
                    <button 
                        onClick={handleAvatarClick} 
                        className="relative group w-24 h-24 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 transition-colors duration-200"
                        disabled={isUploading}
                        title="Change Avatar"
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <UserCircle className="w-16 h-16 text-gray-400" />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity duration-200">
                           {!isUploading && <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />}
                           {isUploading && <div className="w-8 h-8 border-4 border-t-white border-transparent rounded-full animate-spin"></div>}
                        </div>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        disabled={isUploading}
                    />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{authState.user?.fullName}</h1>
                    <p className="text-gray-400">{authState.user?.email}</p>
                </div>
            </div>

            {/* Change Full Name Form */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-sm mb-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <Edit3 className="h-6 w-6 mr-3 text-neon-blue" />
                    Personal Information
                </h2>
                <form onSubmit={handleSubmitInfo(onInfoSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name</label>
                        <input 
                            {...registerInfo('fullName')}
                            id="fullName"
                            className="w-full input-style"
                            disabled={isInfoSubmitting}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary" disabled={isInfoSubmitting}>
                            {isInfoSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-sm">
                 <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <Lock className="h-6 w-6 mr-3 text-neon-pink" />
                    Change Password
                </h2>
                {passwordStep === 'request' ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">
                            For security, we will send a verification code to your email address (<span className="font-semibold text-gray-300">{authState.user?.email}</span>) to proceed with the password change.
                        </p>
                        <div className="flex justify-end pt-2">
                            <button onClick={onRequestCode} className="btn-secondary" disabled={isPasswordSubmitting}>Send Security Code</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="token" className="block text-sm font-medium mb-1">Security Code</label>
                            <input {...registerPassword('token', { required: "Security code is required." })} id="token" className="w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">New Password</label>
                            <input type="password" {...registerPassword('newPassword', { required: "New password is required.", minLength: { value: 8, message: "Password must be at least 8 characters."} })} id="newPassword" className="w-full input-style" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm New Password</label>
                            <input type="password" {...registerPassword('confirmPassword', { required: "Please confirm your new password.", validate: value => value === newPassword || "Passwords do not match" })} id="confirmPassword" className="w-full input-style" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" className="btn-primary" disabled={isPasswordSubmitting}>
                                {isPasswordSubmitting ? "Changing..." : "Change Password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProfileView; 