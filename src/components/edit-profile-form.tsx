
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  username: z.string().min(1, 'Username is required.'),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  imageUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  socialLinks: z.object({
      twitter: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileFormProps {
    initialData: ProfileFormValues;
}

export function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        ...initialData,
        socialLinks: {
            twitter: initialData.socialLinks?.twitter || '',
            instagram: initialData.socialLinks?.instagram || '',
            facebook: initialData.socialLinks?.facebook || '',
        }
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile.');
      }
      toast({ title: 'Profile Updated!' });
      router.push('/profile');
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
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="Tell us a little about yourself"
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
            name="imageUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Profile Picture URL</FormLabel>
                <FormControl>
                    <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <FormField
            control={form.control}
            name="socialLinks.twitter"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Twitter URL</FormLabel>
                <FormControl>
                    <Input placeholder="https://twitter.com/username" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <FormField
            control={form.control}
            name="socialLinks.instagram"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Instagram URL</FormLabel>
                <FormControl>
                    <Input placeholder="https://instagram.com/username" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <FormField
            control={form.control}
            name="socialLinks.facebook"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Facebook URL</FormLabel>
                <FormControl>
                    <Input placeholder="https://facebook.com/username" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
        </form>
    </Form>
  );
}
