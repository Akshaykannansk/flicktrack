import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <AlertTriangle className="mx-auto h-16 w-16 text-primary" />
      <h2 className="mt-6 text-3xl font-headline font-bold">Film Not Found</h2>
      <p className="mt-2 text-muted-foreground">Sorry, we couldn't find the film you were looking for.</p>
      <Button asChild className="mt-6">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
