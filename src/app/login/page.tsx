
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Film } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
        toast({
            title: 'Login Successful',
            description: "Welcome back!",
        });
        router.push('/');
        router.refresh(); // Refresh to update session state in header etc.
    } else {
        const data = await res.json();
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: data.error || 'An unknown error occurred.',
        });
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
            />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
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
