// This file is now deprecated for providing user data.
// It will be replaced by API calls to the Next.js backend,
// which interacts with the PostgreSQL database via Prisma.
// The static film data is still used for seeding the database.

import type { Film } from '@/lib/types';
import { films as staticFilms } from './static-data';

// Helper function to convert static film data to the new Film type
const toFilmType = (f: any): Film => ({
    id: f.id.toString(), // Ensure ID is a string
    title: f.title,
    poster_path: f.posterUrl.includes('placehold.co') ? null : f.posterUrl.split('/').pop(),
    release_date: f.releaseDate,
    vote_average: f.averageRating * 2,
    overview: f.plot
});


// This export is for other parts of the app that might still use it.
export const films = staticFilms.map(toFilmType);
