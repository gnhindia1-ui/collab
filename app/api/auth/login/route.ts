import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { RowDataPacket } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
    id: number;
    email: string;
    password: string;
    name: string;
    role: number;
}

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        const normalizedEmail = email?.trim().toLowerCase();

        // Validate input
        if (!normalizedEmail || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const [users] = await pool.query<UserRow[]>(
            'SELECT id, email, password, name, role FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create session
        const sessionToken = await createSession({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Set session cookie
        await setSessionCookie(sessionToken);

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
