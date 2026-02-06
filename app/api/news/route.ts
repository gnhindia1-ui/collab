import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2/promise';

function generateSlug(title: string) {
    return title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = "SELECT * FROM web_news";
        const queryParams: any[] = [];

        if (status === 'published') {
            query += ' WHERE news_ispub = 1';
        }

        query += ' ORDER BY news_created DESC';

        const [news] = await pool.query(query, queryParams);

        return NextResponse.json(news);
    } catch (error: any) {
        console.error('Fetch news error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 1 && session.role !== 2)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            news_title,
            news_slug: providedSlug,
            news_img,
            news_content,
            news_ispub = 1
        } = await request.json();

        if (!news_title || !news_content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const news_slug = providedSlug || `${generateSlug(news_title)}-${Date.now()}`;

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO web_news (
                news_title, news_slug, news_img, news_content, news_ispub
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                news_title, news_slug, news_img || null, news_content, news_ispub
            ]
        );

        return NextResponse.json({
            message: 'News created successfully',
            newsId: result.insertId,
            slug: news_slug
        });
    } catch (error: any) {
        console.error('Create news error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
