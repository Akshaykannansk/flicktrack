import Link from 'next/link';
import { Film } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <Film className="w-6 h-6 text-primary" />
            <span className="font-headline text-xl font-bold">FlickTrack</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} FlickTrack. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              About
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
