
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import type { FilmDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const logFilmSchema = z.object({
  rating: z.number().min(0.5, 'A rating is required.').max(5),
  review: z.string().optional(),
  watchedDate: z.date({
    required_error: 'A date is required.',
  }),
});

type LogFilmFormValues = z.infer<typeof logFilmSchema>;

interface LogFilmDialogProps {
  film: Pick<FilmDetails, 'id' | 'title'>;
  children: React.ReactNode;
}

export function LogFilmDialog({ film, children }: LogFilmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LogFilmFormValues>({
    resolver: zodResolver(logFilmSchema),
    defaultValues: {
      rating: 0,
      watchedDate: new Date(),
      review: '',
    },
  });

  async function onSubmit(data: LogFilmFormValues) {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filmId: parseInt(film.id, 10),
          rating: data.rating,
          review: data.review,
          loggedDate: data.watchedDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log film.');
      }

      setOpen(false);
      toast({
        title: 'Film Logged!',
        description: `You've successfully logged "${film.title}".`,
      });
      form.reset();
      router.refresh();

    } catch (error) {
       console.error(error);
       toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Log "{film.title}"</DialogTitle>
          <DialogDescription>
            Record your thoughts and rating for this film.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <StarRating
                        currentRating={field.value}
                        onRatingChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="review"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What did you think of the film?"
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="watchedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Watched On</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full sm:w-[240px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Log Entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function StarRating({
  currentRating,
  onRatingChange,
}: {
  currentRating: number;
  onRatingChange: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-8 h-8 sm:w-10 sm:h-10 cursor-pointer transition-colors',
            (hoverRating || currentRating) >= star
              ? 'text-accent fill-accent'
              : 'text-muted-foreground/50'
          )}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        />
      ))}
    </div>
  );
}
