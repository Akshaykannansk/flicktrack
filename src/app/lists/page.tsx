import { userData } from '@/lib/data';
import Link from 'next/link';
import { List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

export default function ListsPage() {
  const { lists } = userData;

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <List className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">My Lists</h1>
      </div>

      {lists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`} className="group block">
              <Card className="h-full flex flex-col bg-secondary border-transparent hover:border-primary/50 transition-colors duration-300">
                <CardContent className="p-4 flex-grow">
                  <div className="relative aspect-video rounded-md overflow-hidden mb-4">
                    <div className="absolute inset-0 grid grid-cols-2 gap-px">
                       {list.films.slice(0, 4).map((film, index) => (
                        <div key={film.id} className="relative">
                           <Image
                            src={film.posterUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="10vw"
                          />
                        </div>
                      ))}
                    </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  </div>
                  <h2 className="text-xl font-headline font-semibold text-primary-foreground group-hover:text-primary transition-colors">{list.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{list.films.length} films</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">You haven't created any lists yet.</h2>
          <p className="text-muted-foreground mt-2">Create lists to organize films by theme, mood, or anything you like.</p>
        </div>
      )}
    </div>
  );
}
