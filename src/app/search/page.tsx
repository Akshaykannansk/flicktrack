import { searchFilms } from '@/lib/tmdb';
import { FilmCard } from '@/components/film-card';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure the page is re-rendered for each search

interface SearchPageProps {
    searchParams: {
        q?: string;
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.q || '';
    const films = await searchFilms(query);

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-3">
                <Search className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-headline font-bold tracking-tighter">
                    Search Results {query && `for "${query}"`}
                </h1>
            </div>

            {query ? (
                films.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {films.map((film) => (
                            <FilmCard key={film.id} film={film} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">No results found for "{query}"</h2>
                        <p className="text-muted-foreground mt-2">Try searching for another film title.</p>
                    </div>
                )
            ) : (
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">Search for a film</h2>
                    <p className="text-muted-foreground mt-2">Use the search bar in the header to find films.</p>
                </div>
            )}
        </div>
    );
}
