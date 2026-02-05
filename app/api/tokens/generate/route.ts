import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireSuperadmin, generateToken } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2/promise';

export async function POST() {
    try {
        // Verify user is superadmin
        const session = await requireSuperadmin();

        // Generate 10-character alphanumeric token
        const token = generateToken();

        // Calculate expiry (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Insert token into database
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO registration_tokens (token, created_by, expires_at) VALUES (?, ?, ?)',
            [token, session.userId, expiresAt]
        );

        return NextResponse.json({
            token,
            tokenId: result.insertId,
            expiresAt: expiresAt.toISOString(),
            createdBy: session.userId,
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Unauthorized') {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            if (error.message.includes('Forbidden')) {
                return NextResponse.json(
                    { error: 'Forbidden: Superadmin access required' },
                    { status: 403 }
                );
            }
        }

        console.error('Token generation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
