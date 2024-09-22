import { NextResponse } from 'next/server';
import { cookies } from 'next/header';

export function middleware(req) {
  // const { hostname } = req.nextUrl;
  // const tenantAlias = hostname.split('.')[0]; // Extract subdomain (e.g., tenant_1)

  const cookieStore = cookies()
  const tenantAlias = cookieStore.get('tenantId')

  /*Attach alias in header so that backend service know what database to access
  Should be used along with JWT authentication */
  req.headers.set('X-Tenant-ID', tenantAlias);

  return NextResponse.next();
}

// Enable this middleware for all routes
export const config = {
  matcher: '/:path*',  // Runs on all pages
};
