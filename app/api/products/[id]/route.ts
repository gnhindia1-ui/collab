
import { NextRequest, NextResponse } from 'next/server';
import productPool from '@/lib/db-products';
import { RowDataPacket } from 'mysql2/promise';
import { requireAuth } from '@/lib/auth';
import pool from '@/lib/db';

/**
 * GET: Fetch a single product by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        const [products] = await productPool.query<RowDataPacket[]>(
            'SELECT * FROM item WHERE item_id = ?',
            [id]
        );

        if (products.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ product: products[0] });
    } catch (error: any) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH: Update a product (with permission checks)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAuth();
        const { id } = await params;
        const body = await request.json();

        // 1. If user is Admin (role 1), check column permissions
        if (session.role === 1) {
            const [permissions] = await pool.query<RowDataPacket[]>(
                'SELECT column_name FROM role_column_permissions WHERE role_id = 1 AND is_editable = FALSE'
            );

            const restrictedColumns = permissions.map(p => p.column_name);

            // Check if any restricted column is being modified
            // This is a basic server-side check. In a real app, you'd compare with existing data.
            // For now, we'll just remove restricted fields from the update body.
            for (const col of restrictedColumns) {
                if (col in body) {
                    delete body[col];
                }
            }
        }

        // 2. Build update query
        const fields = Object.keys(body).filter(k => k !== 'item_id' && k !== 'item_created' && k !== 'item_updated');
        if (fields.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const values = fields.map(f => body[f]);
        const setClause = fields.map(f => `${f} = ?`).join(', ');

        await productPool.query(
            `UPDATE item SET ${setClause}, item_updated = CURRENT_TIMESTAMP WHERE item_id = ?`,
            [...values, id]
        );

        return NextResponse.json({ message: 'Product updated successfully' });

    } catch (error: any) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
