import { NextResponse, type NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const protectedRoutes = [
    '/profile', 
    '/journal', 
    '/lists', 
    '/watchlist', 
    '/likes', 
    '/recommendations'
];

const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (publicRoutes.includes(pathname) && session?.user) {
    return NextResponse.redirect(new URL('/profile', request.url));
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
