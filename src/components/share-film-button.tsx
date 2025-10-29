
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Film, Review } from '@/lib/types';
import { Share2, Instagram, Facebook, Twitter, Copy, Download } from 'lucide-react';
import { useState } from 'react';
import { useToast } from './ui/use-toast';

interface ShareFilmButtonProps {
  film: Film;
  userReview?: Review | null;
}

export function ShareFilmButton({ film, userReview }: ShareFilmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generateUrl = () => {
    const url = new URL('/api/share-film', window.location.origin);
    url.searchParams.set('filmId', film.id.toString());
    if (userReview?.rating) {
      url.searchParams.set('rating', userReview.rating.toString());
    }
    if (userReview?.content) {
      url.searchParams.set('review', userReview.content);
    }
    return url;
  };

  const imageUrl = generateUrl().toString();

  const handleCopy = () => {
    navigator.clipboard.writeText(imageUrl);
    toast({ title: 'Copied to clipboard!' });
  };

  const handleSocialShare = async (platform: 'instagram' | 'facebook' | 'twitter' | 'download') => {
    if (platform === 'instagram') {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'flicktrack-share.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `My review for ${film.title}`,
                    text: `Check out my thoughts on ${film.title}!`,
                });
                 setIsOpen(false);
                return;
            } else {
                 throw new Error('Web Share API not supported for files.');
            }
        } catch (error) {
            console.error('Could not share to Instagram:', error);
            toast({
                title: 'Cannot share directly',
                description: 'Open the image in a new tab to save and share it to your story.',
                variant: 'destructive'
            });
            window.open(imageUrl, '_blank');
        }
    } else if (platform === 'download') {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${film.title.toLowerCase().replace(/\s+/g, '-')}-share.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        const text = encodeURIComponent(`Check out my thoughts on ${film.title}!`);
        let shareUrl = '';
        if (platform === 'facebook') {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`;
        } else if (platform === 'twitter') {
            shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`;
        }
        if(shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="w-full sm:w-auto">
          <Share2 className="mr-2 h-5 w-5" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this Film</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="rounded-lg overflow-hidden border">
                <img src={imageUrl} alt={`Shareable image for ${film.title}`} />
            </div>
            <p className='text-sm text-muted-foreground'>Share your review with friends.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => handleSocialShare('instagram')}><Instagram className="mr-2 h-4 w-4"/> Story</Button>
                <Button variant="outline" onClick={() => handleSocialShare('facebook')}><Facebook className="mr-2 h-4 w-4"/> Post</Button>
                <Button variant="outline" onClick={() => handleSocialShare('twitter')}><Twitter className="mr-2 h-4 w-4"/> Tweet</Button>
                <Button variant="outline" onClick={() => handleSocialShare('download')}><Download className="mr-2 h-4 w-4"/> Save</Button>
            </div>
            <div className="flex items-center space-x-2">
                <Input id="copy-link" value={imageUrl} readOnly />
                <Button type="button" size="sm" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
