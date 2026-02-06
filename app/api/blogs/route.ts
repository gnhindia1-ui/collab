import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2/promise';

// Helper to generate a slug from a title
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
        const status = searchParams.get('status') || '1'; // 1=published

        // Only published blogs are visible to the public by default, but admin sees all
        // Removed JOIN logic as author_id no longer exists. Use blog_author directly.
        let query = "SELECT b.*, b.blog_author as display_author_name FROM blogs b";
        const queryParams: any[] = [];

        if (status !== 'all') {
            query += ' WHERE b.blog_ispub = ?';
            // map 'published' string to 1, 'draft' to 0 if needed, or assume status comes as 0/1
            // User likely wants 'published' logic. Let's assume standard ispub=1
            queryParams.push(status === 'published' ? 1 : 0);
        }

        query += ' ORDER BY b.blog_created DESC';

        const [blogs] = await pool.query(query, queryParams);

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

        const {
            blog_title,
            blog_slug: providedSlug,
            blog_author,
            blog_content,
            blog_heroimg,
            blog_tag,
            blog_keywords,
            blog_description,
            blog_ispub = 0
        } = await request.json();

        if (!blog_title || !blog_content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const blog_slug = providedSlug || `${generateSlug(blog_title)}-${Date.now()}`;

        // Determine author name: Use provided blog_author, or fetch current user's name, or default to 'Admin'
        let finalAuthorName = blog_author;
        if (!finalAuthorName) {
            const [users] = await pool.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ?', [session.userId]);
            if (users.length > 0) {
                finalAuthorName = users[0].name;
            } else {
                finalAuthorName = 'Admin';
            }
        }

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO blogs (blog_title, blog_slug, blog_author, blog_content, blog_heroimg, blog_tag, blog_keywords, blog_description, blog_ispub) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [blog_title, blog_slug, finalAuthorName, blog_content, blog_heroimg, blog_tag, blog_keywords, blog_description, blog_ispub]
        );

        return NextResponse.json({
            message: 'Blog created successfully',
            blogId: result.insertId,
            slug: blog_slug
        });
    } catch (error: any) {
        console.error('Create blog error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
