import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import productsPool from '@/lib/db-products'; // Import products DB connection
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
    try {
        // Run counts in parallel
        const [products] = await productsPool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM item');
        const [blogs] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM blogs');
        const [events] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM web_events');
        const [news] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM web_news');

        return NextResponse.json({
            products: products[0].count,
            blogs: blogs[0].count,
            events: events[0].count,
            news: news[0].count,
        });
    } catch (error: any) {
        console.error('Fetch stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
