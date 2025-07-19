// This file is now deprecated and will be removed in a future step.
// All data is now fetched from the TMDB API via src/lib/tmdb.ts

import type { UserData, Film as StaticFilm } from '@/lib/types';
import { films as staticFilmsData } from './static-data';

// We still need this for now for Journal, Watchlist, etc.
// We will migrate these to use TMDB data later.
export const userData: UserData = {
  watchlist: [],
  journal: [],
  lists: []
};

// This is a temporary shim to keep parts of the app working.
export const films = staticFilmsData.map(f => ({
    id: f.id,
    title: f.title,
    poster_path: f.posterUrl.split('/').pop() || null, // Not a real path, but keeps types happy
    release_date: f.releaseDate,
    vote_average: f.averageRating * 2, // convert to 10-point scale
    overview: f.plot
}));
