import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the JWT from the cookie
  const jwt = request.cookies.get('jwt')?.value;

  let token = request.cookies.get('jwt')
  console.log(jwt) 
  const allCookies = request.cookies.getAll()
 console.log(allCookies) // => [{ name: 'nextjs', value: 'fast' }]
 


  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  console.log('Middleware executed');

  // Set the Authorization header if we have a JWT
  if (jwt) {
    console.log('jwt i got you!!!')
    requestHeaders.set('Authorization', `Bearer ${jwt}`);
  }
  requestHeaders.set('hello', `world`);

  // Get the tenant ID from the cookie (if you're using multi-tenancy)
  const tenantId = request.cookies.get('tenantId')?.value;
  if (tenantId) {
    requestHeaders.set('X-Tenant-ID', tenantId);
  }


    // Define paths that should be accessible without authentication
    const publicPaths = ['/login', '/signup', '/signin' ]; 

    // Get the pathname of the requested URL
    const { pathname } = request.nextUrl;
  
    // If the user is authenticated and tries to access the login page, redirect to home
    if (jwt && pathname === '/login') {
      console.log('Authenticated user trying to access login page. Redirecting to home.');
      return NextResponse.redirect(new URL('/admin/bot-management', request.url));
    }
  
    // Optionally, you can protect certain routes by redirecting unauthenticated users
    // For example, protect all routes except publicPaths
    // const isPublic = publicPaths.includes(pathname);
    // if (!isPublic && !jwt) {
    //   console.log('Unauthenticated user trying to access protected route. Redirecting to login.');
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  
    // Return the response with modified request headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });


}

