import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export async function GET(
    request: NextRequest,
    { params }: { params: { id_or_slug: string } }
) {
    try {
        const idOrSlug = params.id_or_slug;
        const isId = !isNaN(Number(idOrSlug));

        const [blogs] = await pool.query<RowDataPacket[]>(
            `SELECT b.*, u.name as author_name FROM blogs b JOIN users u ON b.author_id = u.id WHERE b.${isId ? 'id' : 'slug'} = ?`,
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
    { params }: { params: { id_or_slug: string } }
) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 1 && session.role !== 2)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id_or_slug; // For PATCH we expect the ID
        const { title, content, excerpt, status } = await request.json();

        const [blogs] = await pool.query<RowDataPacket[]>(
            'SELECT author_id FROM blogs WHERE id = ?',
            [id]
        );

        if (blogs.length === 0) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // Only author or Superadmin can edit
        if (blogs[0].author_id !== session.userId && session.role !== 2) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (title) { updates.push('title = ?'); values.push(title); }
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
    { params }: { params: { id_or_slug: string } }
) {
    try {
        const session = await getSession();
        if (!session || (session.role !== 1 && session.role !== 2)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id_or_slug;

        const [blogs] = await pool.query<RowDataPacket[]>(
            'SELECT author_id FROM blogs WHERE id = ?',
            [id]
        );

        if (blogs.length === 0) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // Only author or Superadmin can delete
        if (blogs[0].author_id !== session.userId && session.role !== 2) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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
