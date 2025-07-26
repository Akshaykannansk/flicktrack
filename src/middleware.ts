import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
    // Add any routes here that you want to protect
    // For example: '/dashboard(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // By default, all routes are public.
  // We only protect the routes that match `isProtectedRoute`.
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
