import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Tell Clerk which pages and APIs can be accessed WITHOUT logging in
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/(.*)',      // <-- THIS UNBLOCKS YOUR AIRTABLE API CONNECTION
  '/startups(.*)',  // <-- Unblocks the startups page (if the form is here)
  '/add-deal(.*)'   // <-- Unblocks the add-deal page (if the form is here)
]);

export default clerkMiddleware((auth, request) => {
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
