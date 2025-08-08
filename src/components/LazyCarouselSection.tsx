
'use client';
import { useInView } from 'react-intersection-observer';
import { FilmCarouselSkeleton } from './film-carousel-skeleton';
import { Suspense } from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
}

export function LazyCarouselSection({ title, children }: Props) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <div ref={ref}>
      <Suspense fallback={<FilmCarouselSkeleton title={title} />}>
        {inView ? children : <FilmCarouselSkeleton title={title} />}
      </Suspense>
    </div>
  );
}
