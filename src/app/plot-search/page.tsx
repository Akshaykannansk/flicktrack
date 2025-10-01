'use client';

import { useState } from 'react';
import { searchFilmsByPlotWithGemini } from '@/lib/tmdb';
import type { Film } from '@/lib/types';
import { FilmCard } from '@/components/film-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PlotSearch() {
  const [plot, setPlot] = useState('');
  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    const results = await searchFilmsByPlotWithGemini(plot);
    setFilms(results);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search by Plot</h1>
      <div className="flex flex-col gap-4 mb-8">
        <Input
          value={plot}
          onChange={(e) => setPlot(e.target.value)}
          placeholder="Enter a plot description..."
          className="w-full"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </div>
  );
}
