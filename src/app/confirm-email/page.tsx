
import { Suspense } from 'react';
import ConfirmationComponent from './confirmation-component';

export default function ConfirmEmailPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-6">Email Confirmation</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <ConfirmationComponent />
      </Suspense>
    </div>
  );
}
