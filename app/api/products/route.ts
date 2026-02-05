
import { NextRequest, NextResponse } from 'next/server';
import productPool from '@/lib/db-products';
import { RowDataPacket } from 'mysql2/promise';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        // Ensure user is authenticated
        await requireAuth();

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const search = searchParams.get('search') || '';

        // Validate limit to be one of the allowed values, or fallback to a reasonable max
        const allowedLimits = [10, 50, 100];
        const safeLimit = allowedLimits.includes(limit) ? limit : 10;
        const offset = (page - 1) * safeLimit;

        // Build query conditions
        let whereClause = '';
        const queryParams: any[] = [];

        if (search) {
            whereClause = `WHERE 
                item_name LIKE ? OR 
                item_drug LIKE ? OR 
                item_brand LIKE ? OR 
                item_manufacturer LIKE ? OR
                item_sku LIKE ?`;
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Get total count
        const [countResult] = await productPool.query<RowDataPacket[]>(
            `SELECT COUNT(*) as total FROM item ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / safeLimit);

        // Get products
        // Selecting specific columns to avoid fetching too much data
        queryParams.push(safeLimit, offset);

        const [products] = await productPool.query<RowDataPacket[]>(
            `SELECT 
        item_id, item_serial, item_name, item_sku, item_slug, 
        item_drug, item_brand, item_manufacturer, item_image, 
        item_status, item_created
       FROM item 
       ${whereClause}
       ORDER BY item_created DESC 
       LIMIT ? OFFSET ?`,
            queryParams
        );

        return NextResponse.json({
            products,
            metadata: {
                total,
                page,
                limit: safeLimit,
                totalPages,
            },
        });

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
