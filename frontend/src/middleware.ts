import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to handle authentication and route protection
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // All routes except dashboard are handled by letting them pass through

  // If accessing dashboard routes, check authentication with backend
  if (pathname.startsWith('/dashboard')) {
    try {
      // Get API URL from environment or use default
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      // Check authentication status with backend
      const response = await fetch(`${apiUrl}/api/auth/status`, {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      });

      if (!response.ok || response.status === 401) {
        // Not authenticated, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const data = await response.json();
      
      if (!data.authenticated || !data.user) {
        // No valid session, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Authentication successful, allow access
      return NextResponse.next();

    } catch (error) {
      console.error('Middleware auth check failed:', error);
      // On error, redirect to login for security
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

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