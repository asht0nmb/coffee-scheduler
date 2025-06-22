import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to handle authentication and route protection
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  // const publicRoutes = ['/login', '/'];
  // const isPublicRoute = publicRoutes.includes(pathname);

  // If accessing dashboard routes, check authentication
  if (pathname.startsWith('/dashboard')) {
    // In a real app, you'd check for authentication tokens/cookies here
    // For now, we'll allow access to dashboard routes
    // TODO: Add proper authentication check
    
    // Example authentication check (commented out):
    // const authToken = request.cookies.get('auth-token');
    // if (!authToken) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};