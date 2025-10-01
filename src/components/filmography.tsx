'use client';

import { useState, useEffect } from 'react';
import { FilmCard, FilmCardSkeleton } from './film-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import type { PersonDetails, Film } from '@/lib/types';

const INITIAL_FILMS_TO_SHOW = 8;

interface UserInteractions {
    watchlistIds: number[];
    likedIds: number[];
}

function FilmographyTab({ films, userInteractions }: { films: Film[], userInteractions: UserInteractions }) {
  const [filmsToShow, setFilmsToShow] = useState(INITIAL_FILMS_TO_SHOW);

  const handleShowMore = () => {
    setFilmsToShow(filmsToShow + INITIAL_FILMS_TO_SHOW);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 mt-4">
        {films.slice(0, filmsToShow).map(film => (
          <FilmCard 
            key={film.id} 
            film={film} 
            isInWatchlist={userInteractions.watchlistIds.includes(parseInt(film.id))}
            isLiked={userInteractions.likedIds.includes(parseInt(film.id))}
          />
        ))}
      </div>
      {films.length > filmsToShow && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleShowMore}>Show More</Button>
        </div>
      )}
    </div>
  );
}

export function Filmography({ filmography }: { filmography: PersonDetails['filmography'] }) {
    const [userInteractions, setUserInteractions] = useState<UserInteractions>({ watchlistIds: [], likedIds: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserInteractions = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/user/interactions');
                if (response.ok) {
                    const data = await response.json();
                    setUserInteractions(data);
                }
            } catch (error) {
                console.error("Failed to fetch user interactions", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInteractions();
    }, []);

    const filmographyTabs = [
        { title: 'Acting', films: filmography.acting },
        { title: 'Directing', films: filmography.directing },
        { title: 'Producing', films: filmography.producing },
        { title: 'Writing', films: filmography.writing },
    ].filter(tab => tab.films.length > 0);

    if (loading) {
        return (
            <div>
                <h2 className="text-2xl font-headline font-semibold mb-4">Filmography</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 mt-4">
                        {[...Array(INITIAL_FILMS_TO_SHOW)].map((_, i) => <FilmCardSkeleton key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-headline font-semibold mb-4">Filmography</h2>
            <Tabs defaultValue={filmographyTabs[0]?.title} className="w-full">
            <TabsList>
                {filmographyTabs.map(tab => (
                <TabsTrigger key={tab.title} value={tab.title}>{tab.title}</TabsTrigger>
                ))}
            </TabsList>

            {filmographyTabs.map(tab => (
                <TabsContent key={tab.title} value={tab.title}>
                    <FilmographyTab films={tab.films as Film[]} userInteractions={userInteractions}/>
                </TabsContent>
            ))}
            </Tabs>
      </div>
    );
}
