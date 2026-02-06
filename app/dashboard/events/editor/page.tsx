'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Dynamic import for React Quill
const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" />
});
import 'react-quill-new/dist/quill.snow.css';

function EventEditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!eventId);
    const [formData, setFormData] = useState({
        events_title: '',
        events_slug: '',
        events_heroimg: '',
        events_content: '',
        events_start: '',
        events_end: '',
        events_ispub: 0,
    });

    useEffect(() => {
        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(`/api/events/${eventId}`);
            if (response.ok) {
                const data = await response.json();

                // Format dates for input type="date"
                const formatDate = (dateString: string) => {
                    if (!dateString) return '';
                    return new Date(dateString).toISOString().split('T')[0];
                };

                setFormData({
                    events_title: data.events_title,
                    events_slug: data.events_slug,
                    events_heroimg: data.events_heroimg || '',
                    events_content: data.events_content,
                    events_start: formatDate(data.events_start),
                    events_end: formatDate(data.events_end),
                    events_ispub: data.events_ispub,
                });
            } else {
                toast.error('Failed to load event');
            }
        } catch (error) {
            console.error('Fetch event error:', error);
            toast.error('Error loading event data');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.events_title || !formData.events_content) {
            toast.error('Title and content are required');
            return;
        }

        setLoading(true);
        try {
            const url = eventId ? `/api/events/${eventId}` : '/api/events';
            const method = eventId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(eventId ? 'Event updated successfully' : 'Event created successfully');
                router.push('/dashboard/events');
            } else {
                const error = await response.json();
                toast.error(error.details || 'Failed to save event');
            }
        } catch (error) {
            console.error('Save event error:', error);
            toast.error('Error saving event');
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean'],
        ],
    };

    if (initialLoading) {
        return (
            <div className="container mx-auto py-10 px-4 text-center">
                <p>Loading editor...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">{eventId ? 'Edit Event' : 'New Event'}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard/events')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Event'}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="events_title">Event Title</Label>
                            <Input
                                id="events_title"
                                placeholder="Enter event title..."
                                value={formData.events_title}
                                onChange={(e) => {
                                    const newTitle = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        events_title: newTitle,
                                        events_slug: !eventId && (!prev.events_slug || prev.events_slug === prev.events_title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'))
                                            ? newTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')
                                            : prev.events_slug
                                    }));
                                }}
                                className="text-lg font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="events_slug">Slug (URL)</Label>
                            <Input
                                id="events_slug"
                                placeholder="custom-url-slug"
                                value={formData.events_slug}
                                onChange={(e) => setFormData({ ...formData, events_slug: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique URL path. Leave empty to auto-generate.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="events_content">Event Details</Label>
                            <div className="bg-card min-h-[600px] border rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.events_content}
                                    onChange={(content) => setFormData({ ...formData, events_content: content })}
                                    modules={modules}
                                    className="h-[550px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card border rounded-lg p-6 space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="events_ispub">Publishing Status</Label>
                                <Select
                                    value={formData.events_ispub.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, events_ispub: parseInt(value) })}
                                >
                                    <SelectTrigger id="events_ispub">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Draft</SelectItem>
                                        <SelectItem value="1">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="events_start">Start Date</Label>
                                    <Input
                                        id="events_start"
                                        type="date"
                                        value={formData.events_start}
                                        onChange={(e) => setFormData({ ...formData, events_start: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="events_end">End Date</Label>
                                    <Input
                                        id="events_end"
                                        type="date"
                                        value={formData.events_end}
                                        onChange={(e) => setFormData({ ...formData, events_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="events_heroimg">Hero Image URL</Label>
                                <Input
                                    id="events_heroimg"
                                    placeholder="https://..."
                                    value={formData.events_heroimg}
                                    onChange={(e) => setFormData({ ...formData, events_heroimg: e.target.value })}
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function EventEditorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EventEditorContent />
        </Suspense>
    );
}
