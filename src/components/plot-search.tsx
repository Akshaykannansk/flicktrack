'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { searchFilmsByPlot } from '@/lib/tmdb';
import { FilmCard } from './film-card';
import { Loader2 } from 'lucide-react';

export function PlotSearch() {
  const [plot, setPlot] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!plot) return;
    setLoading(true);
    const films = await searchFilmsByPlot(plot);
    setResults(films);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-headline font-bold tracking-tighter">
          Search by Plot
        </h2>
        <p className="text-muted-foreground">
          Describe a film's plot to find it.
        </p>
      </div>

      <Textarea
        value={plot}
        onChange={(e) => setPlot(e.target.value)}
        placeholder="A young boy discovers he's a wizard and goes to a magical school..."
        rows={4}
      />
      <Button onClick={handleSearch} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Search
      </Button>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      )}
    </div>
  );
}
