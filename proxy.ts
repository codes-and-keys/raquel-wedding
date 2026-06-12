import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtectedAdminRoute = path.startsWith('/admin') && path !== '/admin/login';

  if (isProtectedAdminRoute) {
    const sessionCookie = request.cookies.get('admin_session')?.value;

    if (sessionCookie !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};