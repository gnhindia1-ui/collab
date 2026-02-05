'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Blog {
    title: string;
    content: string;
    author_name: string;
    created_at: string;
}

export default function BlogPostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.slug) {
            fetchBlog();
        }
    }, [params.slug]);

    const fetchBlog = async () => {
        try {
            const response = await fetch(`/api/blogs/${params.slug}`);
            if (response.ok) {
                const data = await response.json();
                setBlog(data);
            } else {
                toast.error('Blog post not found');
                router.push('/blogs');
            }
        } catch (error) {
            console.error('Fetch blog error:', error);
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

    if (!blog) return null;

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b py-6 bg-card sticky top-0 z-50 backdrop-blur-md bg-card/80">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <Link href="/">
                        <Image src="/logo.svg" alt="Logo" width={150} height={40} className="object-contain" />
                    </Link>
                    <Button variant="ghost" onClick={() => router.push('/blogs')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Articles
                    </Button>
                </div>
            </header>

            <main className="container mx-auto py-16 px-4 max-w-3xl">
                <article className="prose prose-lg dark:prose-invert mx-auto">
                    <header className="mb-10 text-center">
                        <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground mb-6">
                            <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {blog.author_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(blog.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-4xl font-extrabold lg:text-5xl !mb-0">{blog.title}</h1>
                    </header>

                    <div
                        className="rich-text-content mt-12 mb-20"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                </article>

                <div className="border-t pt-10 mt-20">
                    <div className="bg-muted/30 p-8 rounded-2xl text-center">
                        <h3 className="text-lg font-bold mb-2">Enjoyed this article?</h3>
                        <p className="text-muted-foreground mb-6">Check out more of our pharmaceutical insights and updates.</p>
                        <Link href="/blogs">
                            <Button>Explore More Articles</Button>
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
