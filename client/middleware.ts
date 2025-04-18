// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple middleware that doesn't use Clerk's edge-incompatible modules
  const isPublicRoute = request.nextUrl.pathname === '/';
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Check if user is authenticated using a simple check of the clerk session token
  // This is a very basic check - actual authentication would require more
  const hasAuthCookie = request.cookies.has('__session') || 
                       request.cookies.has('__clerk_db_jwt');
  
  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};