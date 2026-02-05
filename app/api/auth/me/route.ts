import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
    id: number;
    email: string;
    name: string;
    role: number;
    created_at: Date;
}

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch full user details from database
        const [users] = await pool.query<UserRow[]>(
            'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
            [session.userId]
        );

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user = users[0];

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
