
'use client';

import { useState, useEffect } from 'react';
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
  const [isReferralEnabled, setIsReferralEnabled] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (response.ok) {
                setIsReferralEnabled(data.isReferralSystemEnabled);
            }
        } catch (error) {
            console.error("Failed to fetch app settings:", error);
        }
    };
    fetchSettings();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isReferralEnabled) {
      // Store details and redirect to the referral page
      const signupDetails = { email, password, fullName, username };
      sessionStorage.setItem('signupDetails', JSON.stringify(signupDetails));
      router.push('/referral');
      return; // Exit early as we are navigating
    } 

    // Sign up directly if referral system is disabled
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
          avatar_url: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`,
        },
        // emailRedirectTo is removed for the OTP flow
      },
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: error.message,
        });
        setIsLoading(false);
    } else if (data.user) {
        // Redirect to the OTP confirmation page on successful sign-up initiation
        router.push(`/auth/confirm-otp?email=${encodeURIComponent(email)}`);
    } else {
        // Fallback for an unexpected state
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: 'An unexpected error occurred. Please try again.',
        });
        setIsLoading(false);
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
              {isLoading ? <Loader2 className="animate-spin" /> : (isReferralEnabled ? 'Continue' : 'Create Account')}
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
