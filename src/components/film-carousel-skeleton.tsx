import { Skeleton } from "@/components/ui/skeleton";

export function FilmCarouselSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-foreground tracking-tight">{title}</h2>
      <div className="flex space-x-2 md:space-x-4 overflow-hidden">
        {[...Array(7)].map((_, i) => (
           <div key={i} className="flex-shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7 pl-2 md:pl-4">
             <div className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-1/4" />
              </div>
           </div>
        ))}
      </div>
    </section>
  );
}
