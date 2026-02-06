'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export function Navbar() {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Home' },
        { href: '/blogs', label: 'Blog' },
        { href: '/events', label: 'Events' },
        { href: '/news', label: 'News' },
    ];

    return (
        <header className="border-b py-6 bg-card sticky top-0 z-50 backdrop-blur-md bg-card/90 supports-[backdrop-filter]:bg-card/60">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                {/* Logo - Left Aligned */}
                <div className="flex justify-start">
                    <Link href="/">
                        <Image src="/logo.svg" alt="Logo" width={150} height={40} className="object-contain" />
                    </Link>
                </div>

                {/* Nav Links - Center Aligned */}
                <nav className="hidden md:flex justify-center gap-8">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-base font-medium transition-colors hover:text-primary whitespace-nowrap",
                                (link.href === '/' && pathname === '/') || (link.href !== '/' && pathname?.startsWith(link.href))
                                    ? "text-primary font-bold"
                                    : "text-muted-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right Actions - Right Aligned */}
                <div className="flex justify-end items-center gap-4">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
