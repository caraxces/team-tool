import React from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import Link from 'next/link';

const ResetPasswordPage = () => {
    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Reset Your Password
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter the code you received via email and your new password.
                </p>
            </div>
            <div className="grid gap-6">
                <ResetPasswordForm />
            </div>
             <p className="px-8 text-center text-sm text-muted-foreground">
                Didn't get a code?{' '}
                <Link
                    href="/forgot-password"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Request a new one
                </Link>
                .
            </p>
        </>
    );
};

export default ResetPasswordPage; 