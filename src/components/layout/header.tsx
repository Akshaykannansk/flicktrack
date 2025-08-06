'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Film, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import * as React from 'react';
import type { Film as FilmType } from '@/lib/types';
import Image from 'next/image';
import { IMAGE_BASE_URL } from '@/lib/tmdb';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/journal', label: 'Journal' },
  { href: '/lists', label: 'Lists' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/recommendations', label: 'For You' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<FilmType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsSuggestionsVisible(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  React.useEffect(() => {
    // Hide suggestions when navigating to a new page
    setIsSuggestionsVisible(false);
    setQuery('');
  }, [pathname]);

  React.useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const debounceTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsSuggestionsVisible(false);
    }
  };

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
                    (pathname.startsWith(link.href) && link.href !== '/') || pathname === link.href ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block" ref={searchContainerRef}>
                <form onSubmit={handleSearchSubmit}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        name="q"
                        placeholder="Search films..."
                        className="pl-10 w-64 bg-secondary focus:bg-background border-secondary"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsSuggestionsVisible(true)}
                        autoComplete="off"
                    />
                </form>
                 {isSuggestionsVisible && (query.length > 1) && (
                    <div className="absolute top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-md bg-popover border border-border shadow-lg z-50">
                        {isLoading ? (
                             <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                             </div>
                        ) : suggestions.length > 0 ? (
                           <ul>
                                {suggestions.map(film => (
                                    <li key={film.id}>
                                        <Link href={`/film/${film.id}`} className="flex items-center p-2 hover:bg-accent transition-colors rounded-md">
                                             <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-secondary">
                                                {film.poster_path ? (
                                                    <Image src={`${IMAGE_BASE_URL}w92${film.poster_path}`} alt={film.title} fill className="object-cover" sizes="40px" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <Film className="w-6 h-6" />
                                                    </div>
                                                )}
                                             </div>
                                             <div className="ml-3">
                                                 <p className="text-sm font-semibold truncate">{film.title}</p>
                                                 <p className="text-xs text-muted-foreground">{film.release_date ? new Date(film.release_date).getFullYear() : 'N/A'}</p>
                                             </div>
                                        </Link>
                                    </li>
                                ))}
                           </ul>
                        ) : (
                            <p className="p-4 text-sm text-muted-foreground text-center">No results found.</p>
                        )}
                    </div>
                 )}
            </div>
            <SignedIn>
                <UserButton afterSignOutUrl="/" />
            </SignedIn>
             <SignedOut>
                <Button asChild>
                    <Link href="/sign-in">Sign In</Link>
                </Button>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
