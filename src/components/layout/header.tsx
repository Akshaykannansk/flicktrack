
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Film, Search, Loader2, User as UserIcon, Clapperboard, Menu, List, Heart, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as React from 'react';
import type { Film as FilmType, PublicUser } from '@/lib/types';
import Image from '@/components/CustomImage';;
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/journal', label: 'Journal' },
  { href: '/lists', label: 'Lists' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/likes', label: 'Likes', icon: Heart },
  { href: '/recommendations', label: 'For You' },
  { href: '/plot-search', label: 'Plot Search' },
];

interface Suggestions {
    films: FilmType[];
    users: PublicUser[];
}


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<Suggestions>({ films: [], users: [] });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            router.refresh();
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [supabase.auth, router]);
  
  
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
    setIsSuggestionsVisible(false);
    setIsMobileMenuOpen(false);
    setQuery('');
  }, [pathname]);

  React.useEffect(() => {
    if (query.length < 2) {
      setSuggestions({ films: [], users: [] });
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
        setSuggestions({ films: [], users: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsSuggestionsVisible(false);
    }
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const MobileNav = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
                {user && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary',
                    (pathname.startsWith(link.href) && link.href !== '/') || pathname === link.href ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {link.icon && <link.icon className="h-5 w-5" />}
                  {link.label}
                </Link>
              ))}
            </nav>
        </SheetContent>
    </Sheet>
  );

  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            {user && (
                <div className="md:hidden">
                    <MobileNav />
                </div>
            )}
            <Link href="/" className="flex items-center space-x-2">
                <Image src="icons/logo.png" alt="FlickTrack logo" width={32} height={32} />
              <span className="font-headline text-2xl font-bold text-primary-foreground hidden sm:inline">
                FlickTrack
              </span>
            </Link>
            {user && (
                 <nav className="hidden md:flex items-center space-x-6">
                    {navLinks.map((link) => (
                        <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5',
                            (pathname.startsWith(link.href) && link.href !== '/') || pathname === link.href ? 'text-primary font-semibold' : 'text-muted-foreground'
                        )}
                        >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.label}
                        </Link>
                    ))}
                 </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
             <div 
                ref={searchContainerRef}
                className={cn(
                    "relative transition-all duration-300 ease-in-out",
                    "w-32 sm:w-64 focus-within:w-64 focus-within:sm:w-80"
                )}
            > 
                <form onSubmit={handleSearchSubmit}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                        type="search"
                        name="q"
                        placeholder="Search films, users..."
                        className="w-full pl-10 bg-secondary focus:bg-background border-secondary"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsSuggestionsVisible(true)}
                        autoComplete="off"
                    />
                </form>
                 {isSuggestionsVisible && (query.length > 1) && (
                    <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto rounded-md bg-popover border border-border shadow-lg z-50">
                        {isLoading ? (
                             <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                             </div>
                        ) : (suggestions.films.length > 0 || suggestions.users.length > 0) ? (
                           <ul className="space-y-2 p-2">
                                {suggestions.films.length > 0 && (
                                  <li>
                                    <p className="px-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2"><Clapperboard className="w-4 h-4" /> Films</p>
                                    <ul className="mt-1">
                                        {suggestions.films.map(film => (
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
                                  </li>
                                )}
                                 {suggestions.users.length > 0 && (
                                  <li>
                                    <p className="px-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2"><Users className="w-4 h-4" /> Profiles</p>
                                    <ul className="mt-1">
                                        {suggestions.users.map(user => (
                                            <li key={user.id}>
                                                <Link href={`/profile/${user.id}`} className="flex items-center p-2 hover:bg-accent transition-colors rounded-md">
                                                     <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user.imageUrl || undefined} alt={user.name || 'avatar'} />
                                                        <AvatarFallback>{user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-semibold truncate">{user.name}</p>
                                                         <p className="text-xs text-muted-foreground">@{user.username}</p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                  </li>
                                )}
                                <Separator className="my-2" />
                                <li>
                                     <Button asChild variant="ghost" className="w-full justify-center">
                                         <Link href={`/search?q=${encodeURIComponent(query)}`}>
                                            <Search className="mr-2 h-4 w-4" /> View all results
                                         </Link>
                                     </Button>
                                </li>
                           </ul>
                        ) : (
                            <p className="p-4 text-sm text-muted-foreground text-center">No results found for "{query}".</p>
                        )}
                    </div>
                 )}
            </div>
            {user ? (
                <>
                <Link href="/profile">
                  <Image 
                    src={user.user_metadata.image_url || user.user_metadata.avatar_url || 'https://placehold.co/32x32.png'} 
                    alt={'User profile'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                    <LogOut className="h-5 w-5" />
                </Button>
                </>
              ) : (
                <Button asChild>
                    <Link href="/login">Sign In</Link>
                </Button>
              )}
          </div>
        </div>
      </div>
    </header>
  );
}
