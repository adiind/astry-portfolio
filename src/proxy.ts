import {authkitProxy} from '@workos-inc/authkit-nextjs';

// Everything is protected except the paths listed here. The proxy also runs on
// public pages so the client-side useAuth() can read the session cookie.
export default authkitProxy({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/', '/callback', '/sign-in', '/sign-up'],
  },
  // Signed-out visitors who hit /studio land on the sign-up screen.
  signUpPaths: ['/studio', '/studio/:path*'],
});

export const config = {
  matcher: [
    // Skip _next internals, favicon, and files with an extension (public/ images etc.)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff2?|ttf|otf|mp4|webm|pdf)$).*)',
  ],
};
