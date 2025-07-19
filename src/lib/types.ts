export interface Film {
  id: string;
  title: string;
  director: string;
  year: number;
  cast: string[];
  plot: string;
  posterUrl: string;
  averageRating: number;
  popularity: number;
  releaseDate: string;
}

export interface LoggedFilm {
  film: Film;
  rating: number;
  review?: string;
  loggedDate: string;
}

export interface UserData {
  watchlist: Film[];
  journal: LoggedFilm[];
}

export type FilmRecommendation = {
  filmTitle: string;
  reason: string;
};
