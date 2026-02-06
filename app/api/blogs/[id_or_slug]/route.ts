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

        const [blogs] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, COALESCE(NULLIF(b.author_name, ''), u.name) as author_name, b.author_name as custom_author_name FROM blogs b JOIN users u ON b.author_id = u.id WHERE b.${isId ? 'id' : 'slug'} = ?`,
            [idOrSlug]
        );

        if (blogs.length === 0) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        return NextResponse.json(blogs[0]);
    } catch (error: any) {
        console.error('Fetch blog error:', error);
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
        const id = id_or_slug; // For PATCH we expect the ID
        const { title, slug, author_name, content, excerpt, status } = await request.json();

        const [blogs] = await pool.query<RowDataPacket[]>(
            'SELECT author_id FROM blogs WHERE id = ?',
            [id]
        );

        if (blogs.length === 0) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // REMOVED: Strict ownership check. Now any authenticated admin (Role 1 or 2) can edit any post.
        // if (blogs[0].author_id !== session.userId && session.role !== 2) {
        //    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // }

        const updates: string[] = [];
        const values: any[] = [];

        if (title) { updates.push('title = ?'); values.push(title); }
        if (slug) { updates.push('slug = ?'); values.push(slug); }
        if (author_name !== undefined) { updates.push('author_name = ?'); values.push(author_name); } // Allow empty string to reset
        if (content) { updates.push('content = ?'); values.push(content); }
        if (excerpt) { updates.push('excerpt = ?'); values.push(excerpt); }
        if (status) { updates.push('status = ?'); values.push(status); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        values.push(id);
        await pool.query(
            `UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({ message: 'Blog updated successfully' });
    } catch (error: any) {
        console.error('Update blog error:', error);
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
        const id = id_or_slug;

        const [blogs] = await pool.query<RowDataPacket[]>(
            'SELECT author_id FROM blogs WHERE id = ?',
            [id]
        );

        if (blogs.length === 0) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // REMOVED: Strict ownership check. Now any authenticated admin (Role 1 or 2) can delete any post.
        // if (blogs[0].author_id !== session.userId && session.role !== 2) {
        //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        // }

        await pool.query('DELETE FROM blogs WHERE id = ?', [id]);

        return NextResponse.json({ message: 'Blog deleted successfully' });
    } catch (error: any) {
        console.error('Delete blog error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
