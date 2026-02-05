import { NextResponse } from 'next/server';
import { verifyPasswordResetToken, updateUserPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const userEmail = await verifyPasswordResetToken(token);

        if (!userEmail) {
            return NextResponse.json({ error: 'Invalid or expired password reset token' }, { status: 400 });
        }

        await updateUserPassword(userEmail, newPassword);

        return NextResponse.json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
