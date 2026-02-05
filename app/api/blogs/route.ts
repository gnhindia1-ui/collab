import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2/promise';

// Helper to generate a slug from a title
function generateSlug(title: string) {
    return title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'published';

        // Only published blogs are visible to the public by default
        const [blogs] = await pool.query(
            'SELECT b.*, u.name as author_name FROM blogs b JOIN users u ON b.author_id = u.id WHERE b.status = ? ORDER BY b.created_at DESC',
            [status]
        );

        return NextResponse.json(blogs);
    } catch (error: any) {
        console.error('Fetch blogs error:', error);
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

        const { title, content, excerpt, status = 'draft' } = await request.json();

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const slug = `${generateSlug(title)}-${Date.now()}`;

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO blogs (title, slug, content, excerpt, author_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [title, slug, content, excerpt, session.userId, status]
        );

        return NextResponse.json({
            message: 'Blog created successfully',
            blogId: result.insertId,
            slug
        });
    } catch (error: any) {
        console.error('Create blog error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
