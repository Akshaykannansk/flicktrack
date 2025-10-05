
'use client';

import { useState } from 'react';
import { Film as FilmType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X, Film as FilmIcon } from 'lucide-react';
import Image from '@/components/CustomImage';;
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface FavoriteFilmsFormProps {
  initialFavorites: FilmType[];
}

export function FavoriteFilmsForm({ initialFavorites }: FavoriteFilmsFormProps) {
  const [selectedFilms, setSelectedFilms] = useState<FilmType[]>(initialFavorites);
  const [searchResults, setSearchResults] = useState<FilmType[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (newQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(newQuery)}`);
        const data = await response.json();
        const filmResults = data.films || [];
        setSearchResults(filmResults);
    } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const addFilm = (film: FilmType) => {
    if (selectedFilms.length < 4 && !selectedFilms.find(f => f.id === film.id)) {
      setSelectedFilms([...selectedFilms, film]);
    }
    setQuery('');
    setSearchResults([]);
  };

  const removeFilm = (filmId: string) => {
    setSelectedFilms(selectedFilms.filter(f => f.id !== filmId));
  };
  
  const handleSave = async () => {
      setIsSaving(true);
      try {
          const response = await fetch('/api/profile/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filmIds: selectedFilms.map(f => parseInt(f.id, 10)) }),
          });
          if (!response.ok) {
              throw new Error('Failed to save favorite films');
          }
          toast({
              title: 'Favorites Updated!',
              description: 'Your favorite films have been saved to your profile.',
          });
          router.push('/profile');
          router.refresh();
      } catch (error) {
          toast({
              variant: 'destructive',
              title: 'Uh oh! Something went wrong.',
              description: 'There was a problem saving your films.',
          });
      } finally {
        setIsSaving(false);
      }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for films to add..."
          className="pl-10"
          value={query}
          onChange={handleSearch}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
        {searchResults.length > 0 && query.length > 1 && (
             <div className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto rounded-md bg-popover border border-border shadow-lg z-10">
                {searchResults.map(film => (
                    <div key={film.id} onClick={() => addFilm(film)} className="flex items-center p-2 hover:bg-accent cursor-pointer">
                        <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-secondary">
                          {film.poster_path ? (
                              <Image src={`${IMAGE_BASE_URL}w92${film.poster_path}`} alt={film.title} fill className="object-cover" sizes="40px" />
                          ) : (
                               <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <FilmIcon className="w-6 h-6" />
                                </div>
                          )}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-semibold">{film.title}</p>
                             <p className="text-xs text-muted-foreground">{film.release_date ? new Date(film.release_date).getFullYear() : 'N/A'}</p>
                        </div>
                    </div>
                ))}
             </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Selected Favorites ({selectedFilms.length} / 4)</h3>
        {selectedFilms.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedFilms.map(film => (
                    <Card key={film.id} className="relative group overflow-hidden">
                        <CardContent className="p-0">
                             <div className="aspect-[2/3] relative">
                                <Image
                                src={film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png'}
                                alt={`Poster for ${film.title}`}
                                fill
                                className="object-cover"
                                sizes="25vw"
                                />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Button variant="destructive" size="icon" onClick={() => removeFilm(film.id)}>
                                        <X className="h-5 w-5" />
                                        <span className="sr-only">Remove {film.title}</span>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No films selected yet.</p>
            </div>
        )}
      </div>
      <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Favorites
          </Button>
      </div>
    </div>
  );
}
