'use server';

import type { Film, FilmDetails, PaginatedResponse, CastMember, CrewMember, PersonDetails } from './types';
import redis from '@/lib/redis';
import { transformFilmData } from './tmdb';

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

export async function getPopularMovies(page = 1, limit = 20): Promise<Film[] | null> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/popular', { page: page.toString() }, { revalidate: 600 });
  return data?.results.slice(0, limit).map(transformFilmData) || null;
}

export async function getTopRatedMovies(page = 1, limit = 20): Promise<Film[] | null> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/top_rated', { page: page.toString() }, { revalidate: 600 });
  return data?.results.slice(0, limit).map(transformFilmData) || null;
}

export async function getNowPlayingMovies(page = 1, limit = 20): Promise<Film[] | null> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/now_playing', { page: page.toString() }, { revalidate: 600 });
  return data?.results.slice(0, limit).map(transformFilmData) || null;
}

export async function getFilmDetails(id: string): Promise<FilmDetails | null> {
    const data = await fetchFromTMDB<any>(`movie/${id}`, { append_to_response: 'credits' });
    
    if (!data) {
        return null;
    }
    
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
        director: data.credits?.crew?.find((person: any) => person.job === 'Director'),
        crew: data.credits?.crew ?? [],
    };
    
    return filmDetails;
}

export async function getFilmCredits(id: string): Promise<{cast: CastMember[], crew: CrewMember[]} | null> {
    const data = await fetchFromTMDB<{cast: CastMember[], crew: CrewMember[]}>(`movie/${id}/credits`);
    if (!data) return null;
    return {
        cast: data.cast.slice(0,10),
        crew: data.crew
    }
}

export async function searchFilms(query: string, page = 1, limit = 20): Promise<Film[]> {
  if (!query) return [];
  const data = await fetchFromTMDB<PaginatedResponse<any>>('search/movie', { query, page: page.toString() });
  return data?.results.slice(0, limit).map(transformFilmData) || [];
}

export async function getPersonDetails(id: string): Promise<PersonDetails | null> {
    const data = await fetchFromTMDB<any>(`person/${id}`, { append_to_response: 'movie_credits' });
    if (!data) {
        return null;
    }

    const acting: Film[] = (data.movie_credits?.cast ?? []).map(transformFilmData);
    const crew: any[] = data.movie_credits?.crew ?? [];

    const directing: Film[] = crew.filter(c => c.job === 'Director').map(transformFilmData);
    const producing: Film[] = crew.filter(c => c.job === 'Producer').map(transformFilmData);
    const writing: Film[] = crew.filter(c => c.job === 'Screenplay' || c.job === 'Writer').map(transformFilmData);

    // Remove duplicates
    const uniqueDirecting = directing.filter((film, index, self) => self.findIndex(f => f.id === film.id) === index);
    const uniqueProducing = producing.filter((film, index, self) => self.findIndex(f => f.id === film.id) === index);
    const uniqueWriting = writing.filter((film, index, self) => self.findIndex(f => f.id === film.id) === index);

    return {
        id: data.id.toString(),
        name: data.name,
        biography: data.biography,
        profile_path: data.profile_path,
        known_for_department: data.known_for_department,
        filmography: {
            acting,
            directing: uniqueDirecting,
            producing: uniqueProducing,
            writing: uniqueWriting,
        },
    };
}
