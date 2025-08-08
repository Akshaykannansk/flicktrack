
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Film, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message,
        });
        setIsLoading(false);
    } else {
        toast({
            title: 'Login Successful',
            description: "Welcome back!",
        });
        // The onAuthStateChange listener in the header will handle the redirect.
        // We just need to refresh the router to make sure server components get the new session.
        router.refresh();
        router.push('/');
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
            <Film className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-3xl font-headline font-bold mt-4">Welcome Back to FlickTrack</h1>
            <p className="text-muted-foreground mt-2">Sign in to continue to your journal.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
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
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>
        </form>
         <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
            </Link>
        </p>
      </div>
    </div>
  );
}
