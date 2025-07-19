import { films } from '@/lib/data';
import { FilmCard } from '@/components/film-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  const popularFilms = [...films].sort((a, b) => b.popularity - a.popularity);
  const topRatedFilms = [...films].sort((a, b) => b.averageRating - a.averageRating);
  const recentFilms = [...films].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  const renderFilmGrid = (filmsToRender: typeof films) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {filmsToRender.map((film) => (
        <FilmCard key={film.id} film={film} />
      ))}
    </div>
  );
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl">Welcome to FlickTrack</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Your personal film journal. Discover new favorites, log your watches, and get AI-powered recommendations.</p>
      </div>

      <Tabs defaultValue="popular" className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="popular">
          {renderFilmGrid(popularFilms)}
        </TabsContent>
        <TabsContent value="top-rated">
          {renderFilmGrid(topRatedFilms)}
        </TabsContent>
        <TabsContent value="recent">
          {renderFilmGrid(recentFilms)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
