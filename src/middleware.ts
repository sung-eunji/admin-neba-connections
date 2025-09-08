import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path requires authentication
  const isProtectedRoute =
    pathname.startsWith('/events/') ||
    pathname.startsWith('/api/events/') ||
    pathname.startsWith('/api/admin-users/');

  if (isProtectedRoute) {
    const adminCookie = request.cookies.get('neba_admin');

    if (!adminCookie || !adminCookie.value) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For page routes, redirect to login
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/events/:path*', '/api/events/:path*', '/api/admin-users/:path*'],
};
