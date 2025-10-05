
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
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import Image from 'next/image';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  username: z.string().min(1, 'Username is required.'),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  // Allow a file or a string URL
  imageUrl: z.any().optional(), 
  socialLinks: z.object({
      twitter: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileFormProps {
    initialData: ProfileFormValues & { id: string };
}

export function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(initialData.imageUrl || null);

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
        let imageUrl = initialData.imageUrl; // Keep the old image by default

        // If a new file is selected (it will be a File object)
        if (data.imageUrl && typeof data.imageUrl !== 'string') {
            const file = data.imageUrl as File;
            const fileExt = file.name.split('.').pop();
            const fileName = `${initialData.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            imageUrl = publicUrlData.publicUrl;
        }

        const updatedProfile = {
            ...data,
            imageUrl: imageUrl,
        };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile.');
      }

      toast({ title: 'Profile Updated!' });
      router.push('/profile');
      router.refresh();

    } catch (error: any) {
       console.error(error);
       toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'There was a problem with your request.',
      });
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
             <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <FormControl>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary">
                                    {preview ? (
                                        <Image src={preview} alt="Avatar preview" width={80} height={80} className="object-cover h-full w-full" />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                                    )}
                                </div>
                                <Input 
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            field.onChange(file);
                                            setPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                <Button asChild variant="outline">
                                    <label htmlFor="file-upload">{preview ? 'Change' : 'Upload'}</label>
                                </Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
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
