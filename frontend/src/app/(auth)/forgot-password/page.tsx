import React from 'react';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

const ForgotPasswordPage = () => {
    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Forgot Your Password?
                </h1>
                <p className="text-sm text-muted-foreground">
                    No problem. Enter your email below and we'll send you a link to reset it.
                </p>
            </div>
            <div className="grid gap-6">
                <ForgotPasswordForm />
            </div>
        </>
    );
};

export default ForgotPasswordPage; 