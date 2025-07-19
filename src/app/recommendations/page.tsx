import { userData } from '@/lib/data';
import { Wand2, Star } from 'lucide-react';
import { RecommendationsForm } from '@/components/recommendations-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecommendationsPage() {
  const viewingHistory = userData.journal.map(entry => ({
    filmTitle: entry.film.title,
    rating: entry.rating,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Wand2 className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">For You</h1>
      </div>
      <p className="text-muted-foreground max-w-2xl">
        Get personalized film recommendations from our AI based on your viewing history. The more films you log and rate, the better your recommendations will be.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle>Your Viewing History</CardTitle>
              <CardDescription>Recommendations are based on these rated films.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {userData.journal.map(entry => (
                <div key={entry.film.id} className="flex justify-between items-center">
                  <span className="text-sm text-primary-foreground">{entry.film.title}</span>
                  <div className="flex items-center text-xs text-amber-400 flex-shrink-0 ml-4">
                    <span className="font-bold mr-1">{entry.rating}</span>
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
           <RecommendationsForm viewingHistory={viewingHistory} />
        </div>
      </div>
    </div>
  );
}
