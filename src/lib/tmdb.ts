import type { Film, FilmDetails, PaginatedResponse, Video, PublicUser } from './types';
import redis from './redis';
import { IMAGE_BASE_URL } from './tmdb-isomorphic';
import prisma from './prisma';
import { clerkClient } from '@clerk/nextjs/server';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

const CACHE_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 hours

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!API_KEY) {
    console.warn('TMDB_API_KEY is not defined. Returning empty data.');
    return null;
  }

  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 } // Revalidate cache every hour for Next.js fetch
    });

    if (!response.ok) {
      console.error(`Failed to fetch from TMDB endpoint: ${endpoint}`, await response.text());
      return null;
    }
    return response.json();
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


export async function getPopularMovies(): Promise<Film[]> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/popular');
  return data?.results.map(transformFilmData) || [];
}

export async function getTopRatedMovies(): Promise<Film[]> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/top_rated');
  return data?.results.map(transformFilmData) || [];
}

export async function getNowPlayingMovies(): Promise<Film[]> {
  const data = await fetchFromTMDB<PaginatedResponse<any>>('movie/now_playing');
  return data?.results.map(transformFilmData) || [];
}

export async function getFilmDetails(id: string): Promise<FilmDetails | null> {
    const cacheKey = `film:${id}`;

    try {
      if (!redis.isOpen) {
        await redis.connect().catch(err => {
            console.error('Failed to connect to Redis for getFilmDetails:', err);
            // If connection fails, we can proceed without caching
        });
      }

      if (redis.isOpen) {
        const cachedFilm = await redis.get(cacheKey);
        if (cachedFilm) {
            console.log(`CACHE HIT for film: ${id}`);
            return JSON.parse(cachedFilm);
        }
      }
    } catch (error) {
        console.error("Redis GET error in getFilmDetails:", error);
    }

    console.log(`CACHE MISS for film: ${id}. Fetching from TMDB.`);
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

    try {
        if (redis.isOpen) {
            await redis.set(cacheKey, JSON.stringify(filmDetails), {
                EX: CACHE_EXPIRATION_SECONDS
            });
        }
    } catch (error) {
        console.error("Redis SET error in getFilmDetails:", error);
    }
    
    return filmDetails;
}

export async function searchFilms(query: string): Promise<Film[]> {
  if (!query) return [];
  const data = await fetchFromTMDB<PaginatedResponse<any>>('search/movie', { query });
  return data?.results.map(transformFilmData) || [];
}

export async function searchUsers(query: string): Promise<PublicUser[]> {
    if (!query) return [];

    try {
        const clerkUsers = await clerkClient.users.getUserList({ query, limit: 10 });

        return clerkUsers.map(user => ({
            id: user.id,
            name: user.fullName,
            username: user.username,
            imageUrl: user.imageUrl,
        }))

    } catch (error) {
        console.error("Failed to search users from Clerk:", error);
        return [];
    }
}
