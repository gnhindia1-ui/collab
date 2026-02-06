'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
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

function NewsEditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const newsId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!newsId);
    const [formData, setFormData] = useState({
        news_title: '',
        news_slug: '',
        news_img: '',
        news_content: '',
        news_ispub: 1, // Default to published for news
    });

    useEffect(() => {
        if (newsId) {
            fetchNews();
        }
    }, [newsId]);

    const fetchNews = async () => {
        try {
            const response = await fetch(`/api/news/${newsId}`);
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    news_title: data.news_title,
                    news_slug: data.news_slug,
                    news_img: data.news_img || '',
                    news_content: data.news_content,
                    news_ispub: data.news_ispub,
                });
            } else {
                toast.error('Failed to load news');
            }
        } catch (error) {
            console.error('Fetch news error:', error);
            toast.error('Error loading news data');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.news_title || !formData.news_content) {
            toast.error('Title and content are required');
            return;
        }

        setLoading(true);
        try {
            const url = newsId ? `/api/news/${newsId}` : '/api/news';
            const method = newsId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(newsId ? 'News updated successfully' : 'News created successfully');
                router.push('/dashboard/news');
            } else {
                const error = await response.json();
                toast.error(error.details || 'Failed to save news');
            }
        } catch (error) {
            console.error('Save news error:', error);
            toast.error('Error saving news');
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
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">{newsId ? 'Edit News Article' : 'New News Article'}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard/news')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Publish Article'}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="news_title">Article Title</Label>
                            <Input
                                id="news_title"
                                placeholder="Enter article title..."
                                value={formData.news_title}
                                onChange={(e) => {
                                    const newTitle = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        news_title: newTitle,
                                        news_slug: !newsId && (!prev.news_slug || prev.news_slug === prev.news_title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'))
                                            ? newTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')
                                            : prev.news_slug
                                    }));
                                }}
                                className="text-lg font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="news_slug">Slug (URL)</Label>
                            <Input
                                id="news_slug"
                                placeholder="custom-url-slug"
                                value={formData.news_slug}
                                onChange={(e) => setFormData({ ...formData, news_slug: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique URL path.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="news_content">Article Content</Label>
                            <div className="bg-card min-h-[600px] border rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.news_content}
                                    onChange={(content) => setFormData({ ...formData, news_content: content })}
                                    modules={modules}
                                    className="h-[550px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card border rounded-lg p-6 space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="news_ispub">Publishing Status</Label>
                                <Select
                                    value={formData.news_ispub.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, news_ispub: parseInt(value) })}
                                >
                                    <SelectTrigger id="news_ispub">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Draft</SelectItem>
                                        <SelectItem value="1">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="news_img">Featured Image URL</Label>
                                <Input
                                    id="news_img"
                                    placeholder="https://..."
                                    value={formData.news_img}
                                    onChange={(e) => setFormData({ ...formData, news_img: e.target.value })}
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function NewsEditorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewsEditorContent />
        </Suspense>
    );
}
