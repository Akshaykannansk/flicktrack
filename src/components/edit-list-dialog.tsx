
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, X, Film as FilmIcon } from 'lucide-react';
import type { Film, FilmList } from '@/lib/types';
import Image from 'next/image';
import { IMAGE_BASE_URL } from '@/lib/tmdb-isomorphic';

const editListSchema = z.object({
  name: z.string().min(1, 'List name is required.').max(100, 'Name must be 100 characters or less.'),
  description: z.string().max(500, 'Description must be 500 characters or less.').optional(),
  filmIds: z.array(z.number()).optional(),
});

type EditListFormValues = z.infer<typeof editListSchema>;

interface EditListDialogProps {
  children: React.ReactNode;
  list: FilmList;
  onListUpdated: () => void;
}

export function EditListDialog({ children, list, onListUpdated }: EditListDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedFilms, setSelectedFilms] = React.useState<Film[]>(list.films.map(f => f.film).filter(Boolean) as Film[]);
  const [searchResults, setSearchResults] = React.useState<Film[]>([]);
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<EditListFormValues>({
    resolver: zodResolver(editListSchema),
    defaultValues: {
        name: list.name || '',
        description: list.description || '',
        filmIds: list.films.map(f => f.film?.id).filter(Boolean).map(id => parseInt(id, 10)),
    },
  });

  React.useEffect(() => {
    form.setValue('filmIds', selectedFilms.map(f => parseInt(f.id, 10)));
  }, [selectedFilms, form]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (newQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(newQuery)}`);
        const data = await response.json();
        setSearchResults(data.films || []);
    } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
    } finally {
        setIsSearching(false);
    }
  };

  const addFilm = (film: Film) => {
    if (!selectedFilms.find(f => f.id === film.id)) {
      setSelectedFilms([...selectedFilms, film]);
    }
    setQuery('');
    setSearchResults([]);
  };

  const removeFilm = (filmId: string) => {
    setSelectedFilms(selectedFilms.filter(f => f.id !== filmId));
  };


  async function onSubmit(data: EditListFormValues) {
    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update list.');
      }

      setOpen(false);
      toast({
        title: 'List Updated!',
        description: `Your list "${data.name}" has been updated.`,
      });
      onListUpdated();
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>
            Update the details for your list.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>List Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div>
                <FormLabel>Manage Films</FormLabel>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search for films to add..."
                        className="pl-10"
                        value={query}
                        onChange={handleSearch}
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                    {searchResults.length > 0 && query.length > 1 && (
                        <div className="absolute top-full mt-2 w-full max-h-60 overflow-y-auto rounded-md bg-popover border border-border shadow-lg z-10">
                            {searchResults.map(film => (
                                <div key={film.id} onClick={() => addFilm(film)} className="flex items-center p-2 hover:bg-accent cursor-pointer">
                                    <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-secondary">
                                    {film.poster_path ? (
                                        <Image src={`${IMAGE_BASE_URL}w92${film.poster_path}`} alt={film.title} fill className="object-cover" sizes="40px" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <FilmIcon className="w-6 h-6" />
                                            </div>
                                    )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-semibold">{film.title}</p>
                                        <p className="text-xs text-muted-foreground">{film.release_date ? new Date(film.release_date).getFullYear() : 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>

               {selectedFilms.length > 0 && (
                 <div className="space-y-2">
                    <FormLabel>Selected Films</FormLabel>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                       {selectedFilms.map(film => (
                         <div key={film.id} className="relative group">
                            <div className="aspect-[2/3] relative rounded-md overflow-hidden">
                                <Image
                                src={film.poster_path ? `${IMAGE_BASE_URL}w500${film.poster_path}` : 'https://placehold.co/400x600.png'}
                                alt={`Poster for ${film.title}`}
                                fill
                                className="object-cover"
                                sizes="25vw"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" type="button" onClick={() => removeFilm(film.id)}>
                                        <X className="h-5 w-5" />
                                        <span className="sr-only">Remove {film.title}</span>
                                    </Button>
                                </div>
                            </div>
                         </div>
                       ))}
                     </div>
                 </div>
               )}
            </div>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
