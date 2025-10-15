
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Film } from 'lucide-react';

// A server action to ensure the user is created in our own database
// We will create this file next.
import { createUserRecord } from './actions'; 

function OTPPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const emailFromParams = searchParams.get('email');
        if (emailFromParams) {
            setEmail(emailFromParams);
            setMessage(`An OTP has been sent to ${emailFromParams}. Please enter it below.`);
        } else {
            setError('Email address not found. Please try signing up again.');
        }
    }, [searchParams]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !otp) {
            setError('Please enter the OTP.');
            return;
        }
        setIsLoading(true);
        setError('');

        const supabase = createClient();
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup',
        });

        if (error) {
            setError(`Error verifying OTP: ${error.message}`);
            setIsLoading(false);
        } else if (data.user && data.session) {
            // User is verified and logged in. Now, ensure they have a record in our DB.
            const user = data.user;
            const creationResult = await createUserRecord({
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata.full_name,
                username: user.user_metadata.username,
                avatar_url: user.user_metadata.avatar_url,
            });

            if (!creationResult.success) {
                // The user is logged in with Supabase, but we failed to create a local record.
                // This is a critical error, but we'll log it and let the user proceed for now.
                console.error("Critical: Failed to create user record after OTP verification:", creationResult.message);
                setError("Could not finalize your account setup. Please contact support.");
                setIsLoading(false);
            } else {
                 // Success! Refresh the page to let the middleware redirect to the app.
                router.refresh();
            }
        }
    };

    return (
        <div className="flex justify-center items-center py-12">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <Film className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-3xl font-headline font-bold mt-4">Confirm Your Account</h1>
                    <p className="text-muted-foreground mt-2">Enter the 6-digit code we sent to your email.</p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <Label htmlFor="otp">One-Time Password</Label>
                        <Input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            placeholder="123456"
                            disabled={isLoading || !email}
                            maxLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify Account'}
                    </Button>
                </form>
                {message && <p className="text-sm text-center text-green-600">{message}</p>}
                {error && <p className="text-sm text-center text-red-600">{error}</p>}
                <div className="text-center text-sm">
                    <p>Didn't get a code? <button type="button" onClick={() => router.push('/signup')} className="underline">Sign up again</button></p>
                </div>
            </div>
        </div>
    );
}

export default function ConfirmOTPPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OTPPageContent />
        </Suspense>
    );
}
