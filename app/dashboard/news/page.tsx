'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Globe, Eye } from 'lucide-react';
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

interface WebNews {
    news_id: number;
    news_title: string;
    news_slug: string;
    news_ispub: number;
    news_created: string;
    news_view: number;
}

export default function NewsDashboardPage() {
    const [newsList, setNewsList] = useState<WebNews[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const response = await fetch('/api/news?status=all');
            if (response.ok) {
                const data = await response.json();
                setNewsList(data);
            } else {
                toast.error('Failed to fetch news');
            }
        } catch (error) {
            console.error('Fetch news error:', error);
            toast.error('Error connecting to API');
        } finally {
            setLoading(false);
        }
    };

    const deleteNews = async (id: number) => {
        if (!confirm('Are you sure you want to delete this news article?')) return;

        try {
            const response = await fetch(`/api/news/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('News deleted successfully');
                setNewsList(newsList.filter((n) => n.news_id !== id));
            } else {
                toast.error('Failed to delete news');
            }
        } catch (error) {
            console.error('Delete news error:', error);
            toast.error('Error connecting to API');
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">News Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your news and press releases.</p>
                </div>
                <Link href="/dashboard/news/editor">
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Article
                    </Button>
                </Link>
            </div>

            <div className="bg-card rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    Loading news...
                                </TableCell>
                            </TableRow>
                        ) : newsList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No news articles found. Create your first one!
                                </TableCell>
                            </TableRow>
                        ) : (
                            newsList.map((news) => (
                                <TableRow key={news.news_id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{news.news_title}</span>
                                            <span className="text-xs text-muted-foreground">/{news.news_slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Eye className="h-3 w-3" />
                                            {news.news_view}
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(news.news_created).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={news.news_ispub === 1 ? 'default' : 'secondary'}>
                                            {news.news_ispub === 1 ? 'Published' : 'Draft'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/news/${news.news_slug}`} target="_blank">
                                                <Button variant="ghost" size="icon" title="View Publicly">
                                                    <Globe className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/news/editor?id=${news.news_id}`}>
                                                <Button variant="ghost" size="icon" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteNews(news.news_id)}
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
