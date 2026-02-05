import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generatePasswordResetToken, storePasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists
        const [rows]: any = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (user) {
            // Generate and store reset token
            const resetToken = generatePasswordResetToken();
            await storePasswordResetToken(email, resetToken);

            // Send reset email
            await sendPasswordResetEmail(email, resetToken);
        }

        // Always return success to prevent email enumeration attacks
        return NextResponse.json({ message: 'If a user with that email exists, a password reset email has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
