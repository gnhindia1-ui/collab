'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WebEvent {
    events_title: string;
    events_content: string;
    events_start: string;
    events_end: string;
    events_heroimg?: string;
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<WebEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.slug) {
            fetchEvent();
        }
    }, [params.slug]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(`/api/events/${params.slug}`);
            if (response.ok) {
                const data = await response.json();
                setEvent(data);
            } else {
                toast.error('Event not found');
                router.push('/events');
            }
        } catch (error) {
            console.error('Fetch event error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-64 bg-muted rounded mb-4" />
                    <div className="h-4 w-32 bg-muted rounded" />
                </div>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b py-6 bg-card sticky top-0 z-50 backdrop-blur-md bg-card/80">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <Link href="/">
                        <Image src="/logo.svg" alt="Logo" width={150} height={40} className="object-contain" />
                    </Link>
                    <Button variant="ghost" onClick={() => router.push('/events')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Events
                    </Button>
                </div>
            </header>

            <main className="container mx-auto py-16 px-4 max-w-3xl">
                <article className="prose prose-lg dark:prose-invert mx-auto">
                    <header className="mb-10 text-center">
                        <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground mb-6">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {event.events_start ? new Date(event.events_start).toLocaleDateString() : 'Date TBA'}
                            </span>
                            {event.events_end && (
                                <>
                                    <span>-</span>
                                    <span>{new Date(event.events_end).toLocaleDateString()}</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-4xl font-extrabold lg:text-5xl !mb-0">{event.events_title}</h1>
                    </header>

                    {event.events_heroimg && (
                        <div className="mb-10 w-full h-64 md:h-96 relative rounded-xl overflow-hidden">
                            <Image
                                src={event.events_heroimg}
                                alt={event.events_title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div
                        className="rich-text-content mt-12 mb-20"
                        dangerouslySetInnerHTML={{ __html: event.events_content }}
                    />
                </article>

                <div className="border-t pt-10 mt-20">
                    <div className="bg-muted/30 p-8 rounded-2xl text-center">
                        <h3 className="text-lg font-bold mb-2">Interested in this event?</h3>
                        <p className="text-muted-foreground mb-6">Explore more upcoming events in our calendar.</p>
                        <Link href="/events">
                            <Button>See More Events</Button>
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="border-t py-12 bg-muted/40 mt-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">© 2024 PharmaCatalog. All rights reserved.</p>
                </div>
            </footer>
            <style jsx global>{`
                .rich-text-content h1 { font-size: 2.25rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; }
                .rich-text-content h2 { font-size: 1.875rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
                .rich-text-content p { margin-bottom: 1.5rem; line-height: 1.75; }
                .rich-text-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
                .rich-text-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; }
                .rich-text-content strong { font-weight: 700; }
                .rich-text-content em { font-style: italic; }
                .rich-text-content blockquote { border-left: 4px solid var(--primary); padding-left: 1rem; font-style: italic; margin: 1.5rem 0; }
                .rich-text-content pre { background: var(--muted); padding: 1rem; borderRadius: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem; }
              `}</style>
        </div>
    );
}
