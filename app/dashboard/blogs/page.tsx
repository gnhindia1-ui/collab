'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Globe, FileText } from 'lucide-react';
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

interface Blog {
    id: number;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    author_name: string;
    created_at: string;
}

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await fetch('/api/blogs?status=all');
            if (response.ok) {
                const data = await response.json();
                setBlogs(data);
            } else {
                toast.error('Failed to fetch blogs');
            }
        } catch (error) {
            console.error('Fetch blogs error:', error);
            toast.error('Error connecting to API');
        } finally {
            setLoading(false);
        }
    };

    const deleteBlog = async (id: number) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;

        try {
            const response = await fetch(`/api/blogs/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Blog deleted successfully');
                setBlogs(blogs.filter((b) => b.id !== id));
            } else {
                toast.error('Failed to delete blog');
            }
        } catch (error) {
            console.error('Delete blog error:', error);
            toast.error('Error connecting to API');
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Blog Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your blog posts and articles.</p>
                </div>
                <Link href="/dashboard/blogs/editor">
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Post
                    </Button>
                </Link>
            </div>

            <div className="bg-card rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    Loading blogs...
                                </TableCell>
                            </TableRow>
                        ) : blogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No blog posts found. Create your first post!
                                </TableCell>
                            </TableRow>
                        ) : (
                            blogs.map((blog) => (
                                <TableRow key={blog.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{blog.title}</span>
                                            <span className="text-xs text-muted-foreground">/{blog.slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{blog.author_name}</TableCell>
                                    <TableCell>
                                        <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>
                                            {blog.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(blog.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/blogs/${blog.slug}`} target="_blank">
                                                <Button variant="ghost" size="icon" title="View Publicly">
                                                    <Globe className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/blogs/editor?id=${blog.id}`}>
                                                <Button variant="ghost" size="icon" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteBlog(blog.id)}
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
