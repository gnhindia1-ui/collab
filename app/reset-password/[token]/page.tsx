'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(true); // Assume valid until checked
    const router = useRouter();
    const { token } = params;

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            toast.error('Password reset token is missing from the URL. Please ensure you clicked the full link.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const currentToken = params.token; // Access params.token directly here

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        console.log('Token received:', currentToken);
        console.log('New Password entered:', password);

        if (!currentToken) {
            toast.error('Password reset token is missing from the URL. Please ensure you clicked the full link.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: currentToken, newPassword: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // If the token is invalid or expired, set tokenValid to false
                if (response.status === 400 && data.error === 'Invalid or expired password reset token') {
                    setTokenValid(false);
                }
                throw new Error(data.error || 'Failed to reset password');
            }

            toast.success(data.message);
            router.push('/'); // Redirect to root (login page) on success

        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (!tokenValid) {
        return (
            <AuthLayout>
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Invalid or Expired Token</CardTitle>
                        <CardDescription>
                            The password reset link is invalid or has expired. Please request a new one.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button onClick={() => router.push('/forgot-password')}>Request New Link</Button>
                    </CardContent>
                </Card>
            </AuthLayout>
        );
    }


    return (
        <AuthLayout>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
