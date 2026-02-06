import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id_or_slug: string }> }
) {
    try {
        const { id_or_slug } = await params; // await params in Next 15+
        const idOrSlug = id_or_slug;
        const isId = !isNaN(Number(idOrSlug));

        // Use events_id or events_slug
        const column = isId ? 'events_id' : 'events_slug';

        const [events] = await pool.query<RowDataPacket[]>(
            `SELECT * FROM web_events WHERE ${column} = ?`,
            [idOrSlug]
        );

        if (events.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json(events[0]);
    } catch (error: any) {
        console.error('Fetch event error:', error);
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
        const id = Number(id_or_slug); // PATCH expects ID usually, but we can verify ownership

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID for update' }, { status: 400 });
        }

        const {
            events_title,
            events_slug,
            events_heroimg,
            events_imgset,
            events_content,
            events_start,
            events_end,
            events_ispub
        } = await request.json();

        const updates: string[] = [];
        const values: any[] = [];

        if (events_title) { updates.push('events_title = ?'); values.push(events_title); }
        if (events_slug) { updates.push('events_slug = ?'); values.push(events_slug); }
        if (events_heroimg !== undefined) { updates.push('events_heroimg = ?'); values.push(events_heroimg); }

        if (events_imgset !== undefined) {
            let safeImgSet = null;
            if (events_imgset) {
                safeImgSet = typeof events_imgset === 'string' ? events_imgset : JSON.stringify(events_imgset);
            }
            updates.push('events_imgset = ?');
            values.push(safeImgSet);
        }

        if (events_content) { updates.push('events_content = ?'); values.push(events_content); }
        if (events_start !== undefined) { updates.push('events_start = ?'); values.push(events_start); }
        if (events_end !== undefined) { updates.push('events_end = ?'); values.push(events_end); }
        if (events_ispub !== undefined) { updates.push('events_ispub = ?'); values.push(events_ispub); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        values.push(id);

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE web_events SET ${updates.join(', ')} WHERE events_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Event updated successfully' });
    } catch (error: any) {
        console.error('Update event error:', error);
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

        const [result] = await pool.query<ResultSetHeader>('DELETE FROM web_events WHERE events_id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error: any) {
        console.error('Delete event error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
