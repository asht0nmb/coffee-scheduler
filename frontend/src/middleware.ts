import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to handle authentication and route protection
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 Middleware check:', { 
    pathname, 
    cookies: request.headers.get('cookie') ? 'present' : 'missing',
    userAgent: request.headers.get('user-agent')?.slice(0, 50) + '...'
  });

  // Temporarily disable server-side auth check to prevent interference
  // Let the client-side auth context handle authentication
  if (pathname.startsWith('/dashboard')) {
    console.log('🎯 Dashboard access - allowing through to client-side auth');
    return NextResponse.next();
  }

  // DISABLED: Server-side auth check
  // The issue is that middleware runs server-side and may not have access
  // to the same session cookies that the client-side context uses
  /*
  if (pathname.startsWith('/dashboard')) {
    try {
      // Get API URL from environment or use default
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      console.log('🔍 Middleware auth check for:', pathname);
      
      // Check authentication status with backend
      const response = await fetch(`${apiUrl}/api/auth/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Middleware auth response:', response.status, response.ok);

      if (!response.ok || response.status === 401) {
        console.log('❌ Middleware: Not authenticated, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const data = await response.json();
      console.log('📊 Middleware auth data:', { authenticated: data.authenticated, hasUser: !!data.user });
      
      if (!data.authenticated || !data.user) {
        console.log('❌ Middleware: No valid session, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      console.log('✅ Middleware: Authentication successful');
      return NextResponse.next();

    } catch (error) {
      console.error('❌ Middleware auth check failed:', error);
      // On error, redirect to login for security
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  */

  // Allow access to public routes
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