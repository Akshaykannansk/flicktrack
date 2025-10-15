
'use server';

import { getPopularMovies, getTopRatedMovies, getNowPlayingMovies } from '@/lib/tmdb-server';
import type { Film } from '@/lib/types';

export async function getMoreFilms(category: string, page: number): Promise<Film[] | null> {
  switch (category) {
    case 'popular':
      return getPopularMovies(page);
    case 'top_rated':
      return getTopRatedMovies(page);
    case 'now_playing':
      return getNowPlayingMovies(page);
    default:
      return null;
  }
}
