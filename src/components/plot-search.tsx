'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FilmCard } from './film-card';
import { Loader2 } from 'lucide-react';
import type { Film } from '@/lib/types';

export function PlotSearch() {
  const [plot, setPlot] = useState('');
  const [results, setResults] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!plot) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plot }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search results.');
      }

      const data = await response.json();
      setResults(data.films || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Textarea
          value={plot}
          onChange={(e) => setPlot(e.target.value)}
          placeholder="A young boy discovers he's a wizard and goes to a magical school..."
          rows={4}
          className="text-base"
        />
        <Button onClick={handleSearch} disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Search
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {loading && !results.length && (
        <div className="text-center text-muted-foreground">
            <p>Our AI is searching the archives...</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3 className="text-2xl font-headline font-semibold mb-4">Search Results</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        </div>
      )}

      {!loading && !results.length && plot && (
          <div className="text-center text-muted-foreground py-8">
              <p>No films found for that plot. Try being more descriptive!</p>
          </div>
      )}
    </div>
  );
}
