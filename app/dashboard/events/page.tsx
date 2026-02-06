'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Globe, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WebEvent {
    events_id: number;
    events_title: string;
    events_slug: string;
    events_start: string;
    events_end: string;
    events_ispub: number;
}

export default function EventsDashboardPage() {
    const [events, setEvents] = useState<WebEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events?status=all');
            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            } else {
                toast.error('Failed to fetch events');
            }
        } catch (error) {
            console.error('Fetch events error:', error);
            toast.error('Error connecting to API');
        } finally {
            setLoading(false);
        }
    };

    const deleteEvent = async (id: number) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const response = await fetch(`/api/events/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Event deleted successfully');
                setEvents(events.filter((e) => e.events_id !== id));
            } else {
                toast.error('Failed to delete event');
            }
        } catch (error) {
            console.error('Delete event error:', error);
            toast.error('Error connecting to API');
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Events Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your upcoming web events.</p>
                </div>
                <Link href="/dashboard/events/editor">
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Event
                    </Button>
                </Link>
            </div>

            <div className="bg-card rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Public</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    Loading events...
                                </TableCell>
                            </TableRow>
                        ) : events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No events found. Create your first event!
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow key={event.events_id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{event.events_title}</span>
                                            <span className="text-xs text-muted-foreground">/{event.events_slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {event.events_start ? new Date(event.events_start).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {event.events_end ? new Date(event.events_end).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={event.events_ispub === 1 ? 'default' : 'secondary'}>
                                            {event.events_ispub === 1 ? 'Yes' : 'No'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/events/editor?id=${event.events_id}`}>
                                                <Button variant="ghost" size="icon" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteEvent(event.events_id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
