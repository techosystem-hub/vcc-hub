import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. ONLY list pages here that an anonymous person is allowed to see.
// Notice that '/' (the home page) is NOT on this list.
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/(.*)'      // Keeps your Airtable forms working!
]);

export default clerkMiddleware((auth, request) => {
  // 2. If the user tries to go to '/' (or any private page) while logged out,
  // this protect() function forces them to '/sign-in'.
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
