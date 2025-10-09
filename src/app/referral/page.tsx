
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

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleFinalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const storedDetails = sessionStorage.getItem('signupDetails');
    if (!storedDetails) {
        toast({
            variant: 'destructive',
            title: 'Something went wrong',
            description: 'Your signup details were not found. Please start over.',
        });
        router.push('/signup');
        return;
    }

    const { email, password, fullName, username } = JSON.parse(storedDetails);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                username: username,
                avatar_url: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`,
                referral_code: referralCode, // Add the referral code here
            },
            // emailRedirectTo is removed for the OTP flow
        },
    });
    
    // Clean up the session storage
    sessionStorage.removeItem('signupDetails');

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
                <h1 className="text-3xl font-headline font-bold mt-4">One Last Step</h1>
                <p className="text-muted-foreground mt-2">Please enter your referral code below.</p>
            </div>
            <form onSubmit={handleFinalSignup} className="space-y-4">
            <div>
                <Label htmlFor="referralCode">Referral Code</Label>
                <Input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                required
                placeholder="Enter referral code"
                disabled={isLoading}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
            </form>
             <p className="text-center text-sm text-muted-foreground">
                Changed your mind?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Go Back
                </Link>
            </p>
        </div>
    </div>
  );
}
