

export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Film {
  id: string;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
}

export interface Video {
    id: string;
    iso_639_1: string;
    iso_3166_1: string;
    key: string;
    name: string;
    site: string;
    size: number;
    type: string;
}

export interface FilmDetails {
  id: string;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genres: Genre[];
  runtime: number;
  cast: CastMember[];
  director?: CrewMember;
  trailer: Video | null;
}

interface FilmOnList {
  film: Film;
}

export interface FilmListSummary {
    id: string;
    name: string;
    description: string;
    films: FilmOnList[];
    _count: {
        films: number;
    }
}

export interface FilmList {
  id: string;
  name: string;
  description: string;
  films: { film: Film | null }[];
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
  };
  _count: {
    likedBy: number;
  }
}

export interface LoggedFilm {
  id: string;
  film: Film;
  rating: number;
  review?: string;
  loggedDate: string;
}

export interface UserData {
  watchlist: Film[];
  journal: LoggedFilm[];
  lists: FilmList[];
}

export type FilmRecommendation = {
  filmTitle: string;
  reason: string;
};

export interface PublicUser {
    id: string;
    name: string | null;
    username: string | null;
    imageUrl: string;
}

export interface SearchResults {
    films: Film[];
    users: PublicUser[];
}
