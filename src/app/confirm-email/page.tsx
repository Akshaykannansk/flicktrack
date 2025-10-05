
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function ConfirmEmailPage() {
  const [message, setMessage] = useState('Confirming your email...');
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    async function handleEmailConfirmation() {
      const token = params.get('token');
      if (!token) {
        setMessage('No confirmation token found. Please try again.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(token);

      if (error) {
        setMessage(`Error confirming email: ${error.message}`);
      } else {
        setMessage('Email confirmed successfully! You will be redirected to the login page shortly.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    }

    handleEmailConfirmation();
  }, [params, router, supabase.auth]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Email Confirmation</h1>
      <p>{message}</p>
    </div>
  );
}
