'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WebEvent {
    events_id: number;
    events_title: string;
    events_slug: string;
    events_start: string;
    events_end: string;
    events_heroimg?: string;
    events_content?: string; // Optional for list view preview if needed
}

export default function PublicEventsListPage() {
    const [events, setEvents] = useState<WebEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // Only fetch published events
            const response = await fetch('/api/events?status=published');
            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Fetch events error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b py-6 bg-card">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <Link href="/">
                        <Image src="/logo.svg" alt="Logo" width={150} height={40} className="object-contain" />
                    </Link>
                    <nav className="flex gap-4">
                        <Link href="/" className="text-sm font-medium hover:text-primary">Home</Link>
                        <Link href="/blogs" className="text-sm font-medium hover:text-primary">Blog</Link>
                        <Link href="/events" className="text-sm font-medium text-primary underline underline-offset-4">Events</Link>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto py-12 px-4">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Upcoming Events</h1>
                    <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
                        Join us for our upcoming webinars, conferences, and industry meetups.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 rounded-lg bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                        <h2 className="text-2xl font-semibold">No upcoming events</h2>
                        <p className="text-muted-foreground mt-2">Check back soon for new updates.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <Card key={event.events_id} className="flex flex-col h-full hover:shadow-md transition-shadow overflow-hidden">
                                {event.events_heroimg && (
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={event.events_heroimg}
                                            alt={event.events_title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                            {event.events_start ? new Date(event.events_start).toLocaleDateString() : 'Date TBA'}
                                        </span>
                                    </div>
                                    <CardTitle className="line-clamp-2 leading-tight">
                                        <Link href={`/events/${event.events_slug}`} className="hover:text-primary transition-colors">
                                            {event.events_title}
                                        </Link>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground line-clamp-3 text-sm">
                                        Check out the details for {event.events_title}.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/events/${event.events_slug}`} className="w-full">
                                        <Button variant="ghost" className="w-full justify-between p-0 font-semibold group">
                                            View Details
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <footer className="border-t py-12 bg-muted/40 mt-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">© 2024 PharmaCatalog. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
