import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface TokenRow extends RowDataPacket {
    id: number;
    expires_at: Date;
    is_used: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, token } = await request.json();

        // Validate input
        if (!email || !password || !name || !token) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Validate token format (10 characters)
        if (token.length !== 10) {
            return NextResponse.json(
                { error: 'Invalid token format' },
                { status: 400 }
            );
        }

        // Check if token exists and is valid
        const [tokenRows] = await pool.query<TokenRow[]>(
            'SELECT id, expires_at, is_used FROM registration_tokens WHERE token = ?',
            [token]
        );

        if (tokenRows.length === 0) {
            return NextResponse.json(
                { error: 'Invalid registration token' },
                { status: 400 }
            );
        }

        const tokenData = tokenRows[0];

        // Check if token is already used
        if (tokenData.is_used) {
            return NextResponse.json(
                { error: 'Registration token has already been used' },
                { status: 400 }
            );
        }

        // Check if token has expired
        if (new Date(tokenData.expires_at) < new Date()) {
            return NextResponse.json(
                { error: 'Registration token has expired' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const [existingUsers] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user (role = 1 for admin)
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 1)',
            [email, hashedPassword, name]
        );

        const userId = result.insertId;

        // Mark token as used
        await pool.query(
            'UPDATE registration_tokens SET is_used = TRUE, used_by = ?, used_at = NOW() WHERE id = ?',
            [userId, tokenData.id]
        );

        return NextResponse.json(
            {
                message: 'Registration successful',
                user: {
                    id: userId,
                    email,
                    name,
                    role: 1,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
