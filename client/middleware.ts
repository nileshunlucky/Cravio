import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const PUBLIC_ROUTES = ['/'];

  const isPublic = PUBLIC_ROUTES.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has('__session') ||
    request.cookies.has('__clerk_db_jwt');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|.*\\..*).*)'], // skip static + api
};
