
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Star } from 'lucide-react';
import { Card } from './ui/card';

interface RatingsDistributionChartProps {
  distribution: { rating: number; count: number }[];
}

export function RatingsDistributionChart({ distribution }: RatingsDistributionChartProps) {
  const totalRatings = distribution.reduce((acc, curr) => acc + curr.count, 0);

  if (totalRatings === 0) {
      return (
          <Card className="mt-2 bg-secondary/50 border-0 flex items-center justify-center p-8">
              <p className="text-muted-foreground text-sm">No ratings yet for this film.</p>
          </Card>
      )
  }
  
  // Re-order to match the 0.5 to 5 star rating system
  const sortedDistribution = [...distribution].sort((a, b) => a.rating - b.rating);

  return (
    <div className="w-full mt-2">
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedDistribution} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
            <XAxis dataKey="rating" hide />
            <YAxis hide />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center text-muted-foreground mt-1 px-1">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          <span className="text-xs">0.5</span>
        </div>
        <div className="flex items-center gap-1">
           <span className="text-xs">5</span>
           <Star className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
