'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// Dynamic import for React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-md" />
});
import 'react-quill-new/dist/quill.snow.css';

function BlogEditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const blogId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!blogId);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
    });

    useEffect(() => {
        if (blogId) {
            fetchBlog();
        }
    }, [blogId]);

    const fetchBlog = async () => {
        try {
            const response = await fetch(`/api/blogs/${blogId}`);
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    title: data.title,
                    content: data.content,
                    excerpt: data.excerpt || '',
                    status: data.status,
                });
            } else {
                toast.error('Failed to load blog post');
            }
        } catch (error) {
            console.error('Fetch blog error:', error);
            toast.error('Error loading blog data');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error('Title and content are required');
            return;
        }

        setLoading(true);
        try {
            const url = blogId ? `/api/blogs/${blogId}` : '/api/blogs';
            const method = blogId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success(blogId ? 'Blog updated successfully' : 'Blog created successfully');
                router.push('/dashboard/blogs');
            } else {
                const error = await response.json();
                toast.error(error.details || 'Failed to save blog');
            }
        } catch (error) {
            console.error('Save blog error:', error);
            toast.error('Error saving blog');
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
                    <h1 className="text-3xl font-bold">{blogId ? 'Edit Blog Post' : 'New Blog Post'}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard/blogs')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                        <Save className="h-4 w-4" />
                        {loading ? 'Saving...' : 'Save Post'}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter a catchy title..."
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="text-lg font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="content">Content</Label>
                            <div className="bg-card min-h-[600px] border rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    modules={modules}
                                    className="h-[550px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card border rounded-lg p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="status">Publishing Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground pt-1">
                                    Drafts are only visible to admins.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Short Description (Excerpt)</Label>
                                <Textarea
                                    id="excerpt"
                                    placeholder="A brief summary for the preview..."
                                    rows={4}
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Visible on the blog list page.
                                </p>
                            </div>

                            <div className="pt-4 space-y-2">
                                <Label className="block text-sm font-medium mb-1">Editor Tips</Label>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                    <li>Use H1 and H2 for headings</li>
                                    <li>Bold for emphasis</li>
                                    <li>Link articles for better SEO</li>
                                    <li>Add images to keep readers engaged</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function BlogEditorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BlogEditorContent />
        </Suspense>
    );
}
