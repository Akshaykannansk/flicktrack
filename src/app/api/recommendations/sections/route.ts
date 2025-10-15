
import { generateFilmRecommendations, GenerateFilmRecommendationsInput } from '@/ai/flows/generate-film-recommendations';
import { fetchWithRetry } from '@/lib/utils';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getFilmDetails, getSimilarMovies, searchFilms } from '@/lib/tmdb-server';
import { Film } from '@/lib/types';

async function getRecommendationsForCategory(category: string, viewingHistory: any[], existingRecommendations: string[]): Promise<Partial<Film>[]> {
    let input: GenerateFilmRecommendationsInput;

    switch (category) {
        case 'top-picks':
        case 'hidden-gems': {
            input = { category, viewingHistory, existingRecommendations };
            const aiRecs = await generateFilmRecommendations(input);
            // The AI returns a title and year, but not an ID. We need to find the ID.
            // Map to a consistent format that matches Partial<Film>
            return aiRecs.recommendations.map(rec => ({ title: rec.filmTitle }));
        }

        case 'more-like-this': {
            if (viewingHistory.length === 0) return [];
            const mostRecentFilm = viewingHistory[0];
            
            const similarMovies = await getSimilarMovies(mostRecentFilm.filmId);
            if (similarMovies && similarMovies.length > 0) {
                return similarMovies.slice(0, 10);
            }
            
            // Fallback to AI if no similar movies are found
            input = { 
                category: 'more-like-this', 
                viewingHistory: [mostRecentFilm],
                existingRecommendations 
            };
            const fallbackRecs = await generateFilmRecommendations(input);
            return fallbackRecs.recommendations.map(rec => ({ title: rec.filmTitle }));
        }

        default:
            return [];
    }
}

async function getViewingHistory(userId: string): Promise<any[]> {
    try {
        const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_SITE_URL}/api/journal?userId=${userId}`);
        
        if (!response.ok) {
            console.error(`Failed to fetch viewing history. Status: ${response.status}`);
            return [];
        }
        
        const journalEntries = await response.json();

        return journalEntries.map((entry: any) => ({
            filmId: parseInt(entry.film.id, 10),
            filmTitle: entry.film.title,
            rating: entry.rating,
        }));
    } catch (error) {
        console.error('An error occurred while fetching viewing history:', error);
        return [];
    }
}


// Pre-defined static sections for logged-out users
const staticSections: Record<string, any[]> = {
    'top-picks': [
      { id: 278, title: 'The Shawshank Redemption', poster_path: '/9cqNxx0GxF0bflZmeSMuL5tnGyn.jpg' },
      { id: 238, title: 'The Godfather', poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' },
      { id: 240, title: 'The Godfather Part II', poster_path: '/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg' },
      { id: 424, title: 'Schindler\'s List', poster_path: '/sF1U4EUQS8YHGqg6BgzA0mFAbqi.jpg' },
      { id: 129, title: 'Spirited Away', poster_path: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
    ],
    'hidden-gems': [
        { id: 389, title: '12 Angry Men', poster_path: '/almost.jpg' },
        { id: 637, title: 'Life Is Beautiful', poster_path: '/74hLDKjD5aK1cdzG9OCteBbasti.jpg' },
        { id: 539, title: 'Psycho', poster_path: '/86lekcTf6nKkX8O0vM429aN2oPl.jpg' },
        { id: 122, title: 'The Lord of the Rings: The Return of the King', poster_path: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg' },
        { id: 155, title: 'The Dark Knight', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
    ],
  };

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        // Return static sections for logged-out users
        return NextResponse.json(staticSections);
    }

    const viewingHistory = await getViewingHistory(user.id);
    const recommendationCategories = ['top-picks', 'hidden-gems', 'more-like-this'];
    let allRecommendations: Record<string, any[]> = {};
    let existingRecommendationTitles: string[] = [];

    for (const category of recommendationCategories) {
        try {
            const recommendations = await getRecommendationsForCategory(category, viewingHistory, existingRecommendationTitles);

            if (recommendations && recommendations.length > 0) {
                const detailedRecommendations = await Promise.all(
                    recommendations.map(async (rec) => {
                        // The AI may not return an ID, so we need to find it.
                        // The TMDB API will always return an ID.
                        const filmId = rec.id ?? (rec.title ? (await searchFilms(rec.title))?.[0]?.id : undefined);
                        
                        if (filmId) {
                            const filmDetails = await getFilmDetails(filmId);
                            return filmDetails ? { id: filmDetails.id, title: filmDetails.title, poster_path: filmDetails.poster_path } : null;
                        }
                        return null;
                    })
                );

                const validRecommendations = detailedRecommendations.filter(rec => rec !== null) as { id: number; title: string; poster_path: string; }[];
                
                if (validRecommendations.length > 0) {
                    allRecommendations[category] = validRecommendations;
                    existingRecommendationTitles.push(...validRecommendations.map(r => r.title));
                }
            }
        } catch (error) {
            console.error(`Failed to get recommendations for category ${category}:`, error);
        }
    }

    return NextResponse.json(allRecommendations);
}
