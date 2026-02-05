import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireSuperadmin } from '@/lib/auth';
import { RowDataPacket } from 'mysql2/promise';

interface TokenRow extends RowDataPacket {
    id: number;
    token: string;
    created_by: number;
    expires_at: Date;
    is_used: boolean;
    used_by: number | null;
    used_at: Date | null;
    created_at: Date;
    creator_name: string;
    user_name: string | null;
}

export async function GET() {
    try {
        // Verify user is superadmin
        await requireSuperadmin();

        // Fetch all tokens with creator and user information
        const [tokens] = await pool.query<TokenRow[]>(`
      SELECT 
        rt.*,
        u1.name as creator_name,
        u2.name as user_name
      FROM registration_tokens rt
      LEFT JOIN users u1 ON rt.created_by = u1.id
      LEFT JOIN users u2 ON rt.used_by = u2.id
      ORDER BY rt.created_at DESC
    `);

        return NextResponse.json({
            tokens: tokens.map((t) => ({
                id: t.id,
                token: t.token,
                createdBy: t.created_by,
                creatorName: t.creator_name,
                expiresAt: t.expires_at,
                isUsed: t.is_used,
                usedBy: t.used_by,
                userName: t.user_name,
                usedAt: t.used_at,
                createdAt: t.created_at,
            })),
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

        console.error('Token list error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
