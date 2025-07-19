// This file acts as a temporary, file-based database for prototyping.
// All data is fetched from TMDB, but user-specific data like journal entries,
// watchlist, and lists are stored here.

import type { UserData, Film, FilmList, LoggedFilm } from '@/lib/types';
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

// Sample Data
const sampleWatchlist: Film[] = [
    toFilmType(staticFilms[2]),
    toFilmType(staticFilms[6]),
    toFilmType(staticFilms[8]),
    toFilmType(staticFilms[10]),
];

const sampleJournal: LoggedFilm[] = [
    {
        film: toFilmType(staticFilms[0]),
        rating: 5,
        review: "An absolute masterpiece. The non-linear storytelling is brilliant and every scene is iconic.",
        loggedDate: "2023-10-26"
    },
    {
        film: toFilmType(staticFilms[1]),
        rating: 4.5,
        review: "Heath Ledger's performance as the Joker is legendary. A gripping and intelligent superhero film.",
        loggedDate: "2023-10-22"
    },
    {
        film: toFilmType(staticFilms[4]),
        rating: 5,
        review: "The greatest mob movie ever made. Al Pacino's transformation is incredible to watch.",
        loggedDate: "2023-09-15"
    }
];

const sampleLists: FilmList[] = [
    {
        id: "mind-bending-movies",
        name: "Mind-Bending Movies",
        description: "Films that will make you question reality.",
        films: [
            toFilmType(staticFilms[2]), // Inception
            toFilmType(staticFilms[10]), // Arrival
            toFilmType(staticFilms[11]), // EEAAO
        ]
    },
    {
        id: "modern-sci-fi-essentials",
        name: "Modern Sci-Fi Essentials",
        description: "Must-see science fiction from the 21st century.",
        films: [
            toFilmType(staticFilms[6]), // Interstellar
            toFilmType(staticFilms[8]), // Blade Runner 2049
            toFilmType(staticFilms[10]), // Arrival
            toFilmType(staticFilms[2]), // Inception
        ]
    }
];


// This is our "database".
export const userData: UserData = {
  watchlist: sampleWatchlist,
  journal: sampleJournal,
  lists: sampleLists
};

// This export is for other parts of the app that might still use it.
export const films = staticFilms.map(toFilmType);
