import type { Film } from './types';

export function transformFilmData(tmdbFilm: any): Film {
    return {
        id: tmdbFilm.id,
        title: tmdbFilm.title,
        poster_path: tmdbFilm.poster_path,
        release_date: tmdbFilm.release_date,
        vote_average: tmdbFilm.vote_average,
        overview: tmdbFilm.overview,
    };
}
