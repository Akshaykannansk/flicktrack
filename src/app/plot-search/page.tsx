
import { PlotSearch } from '@/components/plot-search';

export default function PlotSearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold tracking-tighter">Plot Search</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Describe a plot and let our AI find the film for you.
        </p>
      </div>
      <PlotSearch />
    </div>
  );
}
