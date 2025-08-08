
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Film, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { user } , error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
          image_url: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`
        },
      },
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: error.message,
        });
        setIsLoading(false);
    } else if (user) {
        // This call to our own API creates the user in our public.users table.
        // This is necessary because Supabase auth.users is separate.
        await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName, username, id: user.id })
        });

        toast({
            title: 'Sign Up Successful',
            description: "Check your email to confirm your account, then you can log in.",
        });
        router.push('/login');
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <Film className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-headline font-bold mt-4">Create Your FlickTrack Account</h1>
                <p className="text-muted-foreground mt-2">Join the community and start your film journal.</p>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
            <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                disabled={isLoading}
                />
            </div>
             <div>
                <Label htmlFor="username">Username</Label>
                <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="johndoe"
                disabled={isLoading}
                />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                disabled={isLoading}
                />
            </div>
            <div>
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                disabled={isLoading}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
            </form>
             <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign In
                </Link>
            </p>
        </div>
    </div>
  );
}
