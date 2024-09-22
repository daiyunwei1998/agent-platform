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

  // Return the response with modified request headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

