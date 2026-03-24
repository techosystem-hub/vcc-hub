import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. Pages anyone can see
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/(.*)'      // Keeps Airtable working
]);

// 2. Pages ONLY for logged-out users (Auth pages)
const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)'
]);

export default clerkMiddleware((auth, request) => {
  // Get the user's ID to check if they are logged in
  const { userId } = auth();

  // SCENARIO A: If person is ALREADY signed in and tries to visit sign-in/sign-up
  // -> Redirect them directly to '/'
  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // SCENARIO B: If person is NOT signed in and tries to visit '/' (or any private page)
  // -> Force them to '/sign-in'
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)', 
    '/', 
    '/(api|trpc)(.*)'
  ],
};
