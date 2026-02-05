import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { requireAuth, requireSuperadmin } from '@/lib/auth';
import productPool from '@/lib/db-products';

/**
 * GET: Fetch permissions for a role, including all columns from product DB
 */
export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        const searchParams = request.nextUrl.searchParams;
        const roleId = parseInt(searchParams.get('roleId') || '1');

        // 1. Get all columns from product DB
        const [columns] = await productPool.query<RowDataPacket[]>(
            'SHOW COLUMNS FROM item'
        );
        const allColumnNames = columns.map(c => c.Field.toLowerCase());

        // 2. Get existing permissions
        const [existingPerms] = await pool.query<RowDataPacket[]>(
            'SELECT LOWER(column_name) as column_name, is_editable FROM role_column_permissions WHERE role_id = ?',
            [roleId]
        );

        const permMap = existingPerms.reduce((acc: any, p: any) => {
            acc[p.column_name] = !!p.is_editable;
            return acc;
        }, {});

        // 3. Merge: If not in DB, default to true
        const permissions = allColumnNames
            .filter(name => !['item_id', 'item_created', 'item_updated'].includes(name))
            .map(column_name => ({
                column_name,
                is_editable: permMap[column_name] !== undefined ? permMap[column_name] : true
            }));

        return NextResponse.json({ permissions });
    } catch (error: any) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST: Update permissions for a role (Superadmin only)
 */
export async function POST(request: NextRequest) {
    try {
        await requireSuperadmin();

        const body = await request.json();
        const { roleId, permissions } = body;

        if (!roleId || !Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        // Use a transaction for bulk update
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Delete existing for this role to ensure a clean sync
            await connection.query('DELETE FROM role_column_permissions WHERE role_id = ?', [roleId]);

            // 2. Insert new ones as a batch for efficiency and atomicity
            if (permissions.length > 0) {
                const values = permissions.map((p: any) => [
                    roleId,
                    p.column_name.toLowerCase(),
                    p.is_editable ? 1 : 0
                ]);

                await connection.query(
                    'INSERT INTO role_column_permissions (role_id, column_name, is_editable) VALUES ?',
                    [values]
                );
            }

            await connection.commit();

            // 3. Fetch the absolute state from DB to return to frontend for confirmed sync
            const [confirmedPerms] = await connection.query<RowDataPacket[]>(
                'SELECT LOWER(column_name) as column_name, is_editable FROM role_column_permissions WHERE role_id = ?',
                [roleId]
            );

            return NextResponse.json({
                message: 'Permissions updated successfully',
                permissions: confirmedPerms
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error: any) {
        if (error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('Error updating permissions:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
