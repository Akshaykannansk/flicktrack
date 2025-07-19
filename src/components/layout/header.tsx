'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/films', label: 'Films' },
  { href: '/journal', label: 'Journal' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/recommendations', label: 'For You' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Film className="w-8 h-8 text-primary" />
              <span className="font-headline text-2xl font-bold text-primary-foreground">
                FlickTrack
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <form className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search films..."
                className="pl-10 w-64 bg-secondary focus:bg-background border-secondary"
              />
            </form>
            <Link href="/profile" passHref>
              <Button
                variant={pathname === '/profile' ? 'secondary' : 'ghost'}
                size="icon"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
