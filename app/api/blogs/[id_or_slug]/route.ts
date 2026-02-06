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
            `SELECT b.*, b.blog_author as display_author_name FROM blogs b WHERE b.${isId ? 'blog_id' : 'blog_slug'} = ?`,
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
        const {
            blog_title,
            blog_slug,
            blog_author,
            blog_content,
            blog_heroimg,
            blog_tag,
            blog_keywords,
            blog_description,
            blog_ispub
        } = await request.json();

        const [blogs] = await pool.query<RowDataPacket[]>(
            'SELECT blog_id FROM blogs WHERE blog_id = ?',
            [id]
        );

        if (blogs.length === 0) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // REMOVED: Strict ownership check.

        const updates: string[] = [];
        const values: any[] = [];

        if (blog_title) { updates.push('blog_title = ?'); values.push(blog_title); }
        if (blog_slug) { updates.push('blog_slug = ?'); values.push(blog_slug); }
        if (blog_author !== undefined) { updates.push('blog_author = ?'); values.push(blog_author); }
        if (blog_content) { updates.push('blog_content = ?'); values.push(blog_content); }
        if (blog_heroimg !== undefined) { updates.push('blog_heroimg = ?'); values.push(blog_heroimg); }
        if (blog_tag !== undefined) { updates.push('blog_tag = ?'); values.push(blog_tag); }
        if (blog_keywords !== undefined) { updates.push('blog_keywords = ?'); values.push(blog_keywords); }
        if (blog_description !== undefined) { updates.push('blog_description = ?'); values.push(blog_description); }
        if (blog_ispub !== undefined) { updates.push('blog_ispub = ?'); values.push(blog_ispub); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        values.push(id);
        await pool.query(
            `UPDATE blogs SET ${updates.join(', ')} WHERE blog_id = ?`,
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
            'SELECT author_id FROM blogs WHERE blog_id = ?',
            [id]
        );

        if (blogs.length === 0) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // REMOVED: Strict ownership check.

        await pool.query('DELETE FROM blogs WHERE blog_id = ?', [id]);

        return NextResponse.json({ message: 'Blog deleted successfully' });
    } catch (error: any) {
        console.error('Delete blog error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
