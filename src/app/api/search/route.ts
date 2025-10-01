import { NextResponse } from 'next/server';
import { searchFilmsByPlotWithGemini } from '@/lib/tmdb';

export async function POST(request: Request) {
  try {
    const { plot } = await request.json();

    if (!plot) {
      return NextResponse.json({ error: 'Plot is required' }, { status: 400 });
    }

    const films = await searchFilmsByPlotWithGemini(plot);
    return NextResponse.json({ films });
  } catch (error) {
    console.error('Error in search API route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
