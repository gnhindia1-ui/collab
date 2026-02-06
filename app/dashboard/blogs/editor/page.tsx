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
        blog_title: '',
        blog_slug: '',
        blog_heroimg: '',
        blog_author: '',
        blog_content: '',
        blog_tag: '',
        blog_keywords: '',
        blog_description: '',
        blog_ispub: 0, // 0 for draft, 1 for published
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
                    blog_title: data.blog_title,
                    blog_slug: data.blog_slug,
                    blog_heroimg: data.blog_heroimg || '',
                    blog_author: data.display_author_name || '', // Use the resolved author name logic from API
                    blog_content: data.blog_content,
                    blog_tag: data.blog_tag || '',
                    blog_keywords: data.blog_keywords || '',
                    blog_description: data.blog_description || '',
                    blog_ispub: data.blog_ispub,
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
        if (!formData.blog_title || !formData.blog_content) {
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
                            <Label htmlFor="blog_title">Blog Title</Label>
                            <Input
                                id="blog_title"
                                placeholder="Enter a catchy title..."
                                value={formData.blog_title}
                                onChange={(e) => {
                                    const newTitle = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        blog_title: newTitle,
                                        // Auto-generate slug if creating new and slug is empty or default
                                        blog_slug: !blogId && (!prev.blog_slug || prev.blog_slug === prev.blog_title.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'))
                                            ? newTitle.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-')
                                            : prev.blog_slug
                                    }));
                                }}
                                className="text-lg font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="blog_slug">Slug (URL)</Label>
                            <Input
                                id="blog_slug"
                                placeholder="custom-url-slug"
                                value={formData.blog_slug}
                                onChange={(e) => setFormData({ ...formData, blog_slug: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique URL path. Leave empty to auto-generate.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="blog_content">Content</Label>
                            <div className="bg-card min-h-[600px] border rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.blog_content}
                                    onChange={(content) => setFormData({ ...formData, blog_content: content })}
                                    modules={modules}
                                    className="h-[550px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card border rounded-lg p-6 space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="blog_ispub">Publishing Status</Label>
                                <Select
                                    value={formData.blog_ispub.toString()}
                                    onValueChange={(value) => setFormData({ ...formData, blog_ispub: parseInt(value) })}
                                >
                                    <SelectTrigger id="blog_ispub">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Draft</SelectItem>
                                        <SelectItem value="1">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blog_author">Author Name</Label>
                                <Input
                                    id="blog_author"
                                    placeholder="Optional (Default: You)"
                                    value={formData.blog_author}
                                    onChange={(e) => setFormData({ ...formData, blog_author: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Override displayed author.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blog_heroimg">Hero Image URL</Label>
                                <Input
                                    id="blog_heroimg"
                                    placeholder="https://..."
                                    value={formData.blog_heroimg}
                                    onChange={(e) => setFormData({ ...formData, blog_heroimg: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blog_description">SEO Description</Label>
                                <Textarea
                                    id="blog_description"
                                    placeholder="Short summary for SEO and previews..."
                                    rows={3}
                                    value={formData.blog_description}
                                    onChange={(e) => setFormData({ ...formData, blog_description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blog_tag">Tags</Label>
                                <Input
                                    id="blog_tag"
                                    placeholder="Comma separated tags..."
                                    value={formData.blog_tag}
                                    onChange={(e) => setFormData({ ...formData, blog_tag: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blog_keywords">Keywords</Label>
                                <Input
                                    id="blog_keywords"
                                    placeholder="Comma separated keywords..."
                                    value={formData.blog_keywords}
                                    onChange={(e) => setFormData({ ...formData, blog_keywords: e.target.value })}
                                />
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
