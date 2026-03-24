import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// This defines which routes do NOT require a login
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)'
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)', // Skip static files (images, etc)
    '/', 
    '/(api|trpc)(.*)'
  ],
};
