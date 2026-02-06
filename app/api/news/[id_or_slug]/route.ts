import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id_or_slug: string }> }
) {
    try {
        const { id_or_slug } = await params;
        const idOrSlug = id_or_slug;
        const isId = !isNaN(Number(idOrSlug));

        const column = isId ? 'news_id' : 'news_slug';

        const [news] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM web_news WHERE ${column} = ?`,
            [idOrSlug]
        );

        if (news.length === 0) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        // Increment view count
        // Note: In a high traffic app, this might be optimized or moved to a separate lightweight endpoint
        const newsId = news[0].news_id;
        await pool.query('UPDATE web_news SET news_view = news_view + 1 WHERE news_id = ?', [newsId]);

        return NextResponse.json(news[0]);
    } catch (error: any) {
        console.error('Fetch news error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id_or_slug: string }> }
) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 1 && session.role !== 2)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id_or_slug } = await params;
        const id = Number(id_or_slug);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID for update' }, { status: 400 });
        }

        const {
            news_title,
            news_slug,
            news_img,
            news_content,
            news_ispub
        } = await request.json();

        const updates: string[] = [];
        const values: any[] = [];

        if (news_title) { updates.push('news_title = ?'); values.push(news_title); }
        if (news_slug) { updates.push('news_slug = ?'); values.push(news_slug); }
        if (news_img !== undefined) { updates.push('news_img = ?'); values.push(news_img); }
        if (news_content) { updates.push('news_content = ?'); values.push(news_content); }
        if (news_ispub !== undefined) { updates.push('news_ispub = ?'); values.push(news_ispub); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        values.push(id);

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE web_news SET ${updates.join(', ')} WHERE news_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'News updated successfully' });
    } catch (error: any) {
        console.error('Update news error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id_or_slug: string }> }
) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 1 && session.role !== 2)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id_or_slug } = await params;
        const id = Number(id_or_slug);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID for delete' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>('DELETE FROM web_news WHERE news_id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'News deleted successfully' });
    } catch (error: any) {
        console.error('Delete news error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
