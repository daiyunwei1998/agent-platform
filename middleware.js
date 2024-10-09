import { NextResponse } from 'next/server';
import jwtDecode from 'jwt-decode';

export function middleware(request) {
  // Get the JWT from the cookie
  const jwtToken = request.cookies.get('jwt')?.value;

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  console.log('Middleware executed');

  let userRole = null;

  // Parse the JWT if it exists (Note: this doesn't verify the token)
  if (jwtToken) {
    try {
      const decodedToken = jwtDecode(jwtToken);
      console.log('JWT decoded successfully:', decodedToken);

      // Extract the role from the decoded token
      userRole = decodedToken.role;
      console.log('User role:', userRole);

      // Set the Authorization header
      requestHeaders.set('Authorization', `Bearer ${jwtToken}`);
    } catch (err) {
      console.log('Error decoding JWT:', err);
    }
  }

  // Get the tenant ID from the cookie (if you're using multi-tenancy)
  const tenantId = request.cookies.get('tenantId')?.value;
  if (tenantId) {
    requestHeaders.set('X-Tenant-ID', tenantId);
  }

  // Define paths that should be accessible without authentication
  const publicPaths = ['/login', '/signup', '/signin'];

  // Get the pathname of the requested URL
  const { pathname } = request.nextUrl;

  // If the user is authenticated and tries to access the login page, redirect to home
  if (jwtToken && pathname === '/login') {
    console.log('Authenticated user trying to access login page. Redirecting to home.');
    return NextResponse.redirect(new URL('/admin/bot-management', request.url));
  }

  // Protect /admin/* routes based on role
  if (pathname.startsWith('/admin')) {
    if (!jwtToken) {
      console.log('Unauthenticated access attempt to admin pages. Redirecting to login.');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (userRole !== 'ADMIN') {
      console.log('Unauthorized user attempting to access admin pages. Redirecting to unauthorized page.');
      return NextResponse.redirect(new URL('/unauthorized', request.url));  // Redirect to an unauthorized page
    }
  }

  // Optionally, protect all other routes except public paths
  const isPublic = publicPaths.includes(pathname);
  if (!isPublic && !jwtToken) {
    console.log('Unauthenticated user trying to access protected route. Redirecting to login.');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Return the response with modified request headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
