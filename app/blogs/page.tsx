'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Blog {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    author_name: string;
    created_at: string;
}

export default function PublicBlogListPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await fetch('/api/blogs');
            if (response.ok) {
                const data = await response.json();
                setBlogs(data);
            }
        } catch (error) {
            console.error('Fetch blogs error:', error);
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
                        <Link href="/blogs" className="text-sm font-medium text-primary underline underline-offset-4">Blog</Link>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto py-12 px-4">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Our Blog</h1>
                    <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
                        Stay updated with the latest pharmaceutical news, inventory management tips, and company updates.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 rounded-lg bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                        <h2 className="text-2xl font-semibold">No blog posts found</h2>
                        <p className="text-muted-foreground mt-2">Check back soon for new updates.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <Card key={blog.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <User className="h-3 w-3" />
                                        <span>{blog.author_name}</span>
                                        <span>•</span>
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <CardTitle className="line-clamp-2 leading-tight">
                                        <Link href={`/blogs/${blog.slug}`} className="hover:text-primary transition-colors">
                                            {blog.title}
                                        </Link>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-muted-foreground line-clamp-3 text-sm">
                                        {blog.excerpt || 'Read more about this post...'}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/blogs/${blog.slug}`} className="w-full">
                                        <Button variant="ghost" className="w-full justify-between p-0 font-semibold group">
                                            Read Full Article
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
