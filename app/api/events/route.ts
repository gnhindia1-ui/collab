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
        const status = searchParams.get('status');

        let query = "SELECT * FROM web_events";
        const queryParams: any[] = [];

        if (status === 'published') {
            query += ' WHERE events_ispub = 1';
        } else if (status === 'all') {
            // No filter, show all
        } else {
            // Default to only published (safe default)
            query += ' WHERE events_ispub = 1';
        }

        query += ' ORDER BY events_start DESC';

        const [events] = await pool.query(query, queryParams);

        return NextResponse.json(events);
    } catch (error: any) {
        console.error('Fetch events error:', error);
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
            events_title,
            events_slug: providedSlug,
            events_heroimg,
            events_imgset,
            events_content,
            events_start,
            events_end,
            events_ispub = 0
        } = await request.json();

        if (!events_title || !events_content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const events_slug = providedSlug || `${generateSlug(events_title)}-${Date.now()}`;

        // Ensure imgset is valid JSON if provided
        let safeImgSet = null;
        if (events_imgset) {
            try {
                // If it comes as an array/object, stringify it. If string, check valid json.
                safeImgSet = typeof events_imgset === 'string' ? events_imgset : JSON.stringify(events_imgset);
                JSON.parse(safeImgSet); // validation check
            } catch (e) {
                return NextResponse.json({ error: 'Invalid JSON for image set' }, { status: 400 });
            }
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO web_events (
                events_title, events_slug, events_heroimg, events_imgset, 
                events_content, events_start, events_end, events_ispub
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                events_title, events_slug, events_heroimg || null, safeImgSet,
                events_content, events_start || null, events_end || null, events_ispub
            ]
        );

        return NextResponse.json({
            message: 'Event created successfully',
            eventId: result.insertId,
            slug: events_slug
        });
    } catch (error: any) {
        console.error('Create event error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
