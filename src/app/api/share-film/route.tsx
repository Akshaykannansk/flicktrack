
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getFilm } from '@/lib/tmdb';

export const runtime = 'edge';

const Star = ({ filled, size }: { filled: boolean; size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "#FFD700" : "#E0E0E0"} // Gold if filled, light gray otherwise
    stroke="#B8860B" // Darker gold for the star outline
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filmId = searchParams.get('filmId');
    const rating = searchParams.get('rating');
    const review = searchParams.get('review');

    if (!filmId) {
      return new Response('Missing filmId', { status: 400 });
    }

    const film = await getFilm(filmId, true);

    if (!film) {
      return new Response('Film not found', { status: 404 });
    }

    const posterUrl = `https://image.tmdb.org/t/p/w500${film.poster_path}`;

    const StarRating = ({ rating, size }: { rating: number, size: number }) => {
      const totalStars = 5;
      const filledStars = Math.round(rating / 2);
      return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
          {[...Array(totalStars)].map((_, i) => (
            <Star key={i} filled={i < filledStars} size={size} />
          ))}
        </div>
      );
    };

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            color: 'white',
            fontFamily: '"Inter", sans-serif',
            padding: '40px',
            position: 'relative',
          }}
        >
          <img 
            src={posterUrl} 
            alt={film.title} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.1,
              filter: 'blur(10px)'
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: '40px',
            zIndex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)',
          }}>
            <img src={posterUrl} alt={film.title} width="300" style={{ borderRadius: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', height: '100%' }}>
              <h1 style={{ fontSize: '48px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{film.title}</h1>
              <p style={{ fontSize: '28px', color: '#b3b3b3', marginTop: '10px' }}>
                {new Date(film.release_date).getFullYear()}
              </p>
              {rating && (
                <div style={{ marginTop: '30px' }}>
                  <StarRating rating={parseInt(rating)} size={32} />
                </div>
              )}
              {review && (
                <p style={{ fontSize: '22px', marginTop: '30px', fontStyle: 'italic', color: '#e6e6e6', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
                  `&ldquo;{review}&rdquo;`
                </p>
              )}
            </div>
          </div>
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1,
          }}>
             <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded90420192e09e3da95dc8de82d614b3113f964132d0f3162a8.svg" width="40" alt="TMDB Logo" />
             <span style={{ fontSize: '18px', fontWeight: 500, color: '#cccccc'}}>Powered by TMDB</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error(e.message);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
