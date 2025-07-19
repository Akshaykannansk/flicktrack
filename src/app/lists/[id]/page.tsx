import { userData } from '@/lib/data';
import { notFound } from 'next/navigation';
import { FilmCard } from '@/components/film-card';
import { List } from 'lucide-react';

export function generateStaticParams() {
  return userData.lists.map((list) => ({
    id: list.id,
  }));
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const list = userData.lists.find((l) => l.id === params.id);

  if (!list) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-3">
            <List className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-headline font-bold tracking-tighter">{list.name}</h1>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">{list.description}</p>
        <p className="text-sm text-muted-foreground mt-2">{list.films.length} films</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {list.films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </div>
  );
}
