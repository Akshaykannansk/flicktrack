import { Skeleton } from "@/components/ui/skeleton";

export function FilmCarouselSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-foreground tracking-tight">{title}</h2>
      <div className="flex space-x-2 md:space-x-4">
        {[...Array(6)].map((_, i) => (
           <div key={i} className="flex-shrink-0 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/8 pl-2 md:pl-4">
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
