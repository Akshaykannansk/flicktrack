
import { NextResponse, type NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const protectedRoutes = [
    '/profile', 
    '/journal', 
    '/lists', 
    '/watchlist', 
    '/likes', 
    '/recommendations',
    '/profile/edit'
];

const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (sessionCookie) {
    const session = await decrypt(sessionCookie);
    if (!session && isProtectedRoute) {
        // Invalid session, clear cookie and redirect
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set('session', '', { expires: new Date(0) });
        return response;
    }

    if (session && isPublicRoute) {
        return NextResponse.redirect(new URL('/profile', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
