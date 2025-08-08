
import type { Film, FilmDetails, PaginatedResponse, Video } from './types';
import { IMAGE_BASE_URL } from './tmdb-isomorphic';
import redis from '@/lib/redis';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;
const CACHE_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 hours

async function fetchFromTMDB<T>(
  endpoint: string,
  params: Record<string, string> = {},
  options: { revalidate?: number } = {}
): Promise<T | null> {
  if (!API_KEY) {
    console.error('TMDB_API_KEY is not defined.');
    return null;
  }
  
  const queryString = new URLSearchParams(params).toString();
  const cacheKey = `tmdb:${endpoint}?${queryString}`;

  try {
      if (!redis.isOpen) {
        await redis.connect().catch(err => {
            console.error('Failed to connect to Redis for getFilmDetails:', err);
        });
      }

      if (redis.isOpen) {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(`CACHE HIT for ${cacheKey}`);
            return JSON.parse(cachedData) as T;
        }
      }
    } catch (error) {
        console.error("Redis GET error in fetchFromTMDB:", error);
    }
    
  console.log(`CACHE MISS for ${cacheKey}. Fetching from TMDB.`);

  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
        next: { revalidate: options.revalidate ?? 3600 } // Revalidate every hour
    }); 

    if (!response.ok) {
      console.error(`Failed to fetch from TMDB endpoint: ${endpoint}`, await response.text());
      return null;
    }
    const data = await response.json() as T;

    try {
        if (redis.isOpen) {
            await redis.set(cacheKey, JSON.stringify(data), {
                EX: CACHE_EXPIRATION_SECONDS
            });
        }
    } catch (error) {
        console.error("Redis SET error in fetchFromTMDB:", error);
    }

    return data;
  } catch (error) {
     console.error(`Network error when fetching from TMDB endpoint: ${endpoint}`, error);
     return null;
  }
}

function transformFilmData(tmdbFilm: any): Film {
    return {
        id: tmdbFilm.id.toString(),
        title: tmdbFilm.title,
        poster_path: tmdbFilm.poster_path,
        release_date: tmdbFilm.release_date,
        vote_average: tmdbFilm.vote_average,
        overview: tmdbFilm.overview,
    };
}


export async function getPopularMovies(page = 1, limit = 8): Promise<Film[] | null> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/popular', { page: page.toString() }, { revalidate: 600 });
  return data?.results.slice(0, limit).map(transformFilmData) || null;
}

export async function getTopRatedMovies(page = 1, limit = 8): Promise<Film[] | null> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/top_rated', { page: page.toString() }, { revalidate: 600 });
  return data?.results.slice(0, limit).map(transformFilmData) || null;
}

export async function getNowPlayingMovies(page = 1, limit = 8): Promise<Film[] | null> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/now_playing', { page: page.toString() }, { revalidate: 600 });
  return data?.results.slice(0, limit).map(transformFilmData) || null;
}

export async function getFilmDetails(id: string): Promise<FilmDetails | null> {
    const data = await fetchFromTMDB<any>(`movie/${id}`, { append_to_response: 'credits,videos' });
    
    if (!data) {
        return null;
    }

    const mainTrailer = data.videos?.results?.find((v: Video) => v.site === 'YouTube' && v.type === 'Trailer');
    
    const filmDetails: FilmDetails = {
        id: data.id.toString(),
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        release_date: data.release_date,
        vote_average: data.vote_average,
        genres: data.genres || [],
        runtime: data.runtime,
        cast: data.credits?.cast?.slice(0, 10) || [],
        director: data.credits?.crew?.find((person: any) => person.job === 'Director'),
        trailer: mainTrailer || null,
    };
    
    return filmDetails;
}

export async function searchFilms(query: string): Promise<Film[]> {
  if (!query) return [];
  const data = await fetchFromTMDB<PaginatedResponse<any>>('search/movie', { query });
  return data?.results.map(transformFilmData) || [];
}
