
import { Wand2, Star } from 'lucide-react';
import { RecommendationsForm } from '@/components/recommendations-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function RecommendationsPage() {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      userId: userId,
    },
    include: {
      films: {
        select: { title: true },
      },
    },
    orderBy: {
      logged_date: 'desc',
    },
    take: 20,
  });

  const viewingHistory = journalEntries?.map(entry => ({
    filmTitle: entry.films.title,
    rating: entry.rating,
  })) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Wand2 className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-headline font-bold tracking-tighter">
          For You
        </h1>
      </div>
      <p className="max-w-2xl text-muted-foreground">
        Get personalized film recommendations from our AI based on your viewing
        history. The more films you log and rate, the better your
        recommendations will be.
      </p>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle>Your Viewing History</CardTitle>
              <CardDescription>
                Recommendations are based on these rated films.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 space-y-4 overflow-y-auto">
              {journalEntries && journalEntries.length > 0 ? (
                journalEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-foreground">
                      {entry.films.title}
                    </span>
                    <div className="ml-4 flex flex-shrink-0 items-center text-xs text-amber-400">
                      <span className="mr-1 font-bold">{entry.rating}</span>
                      <Star className="h-3 w-3 fill-current" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t logged any films yet.
                </p>
              )}
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
