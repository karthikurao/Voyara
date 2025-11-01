import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()

  // Attach baseline security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'no-referrer-when-downgrade')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  // Content Security Policy
  const isDev = process.env.NODE_ENV !== 'production'
  const cspParts = [
    "default-src 'self'",
    "base-uri 'self'",
    // Allow inline styles in both envs due to Tailwind and component libs
    "style-src 'self' 'unsafe-inline'",
    // In dev, Next may need 'unsafe-eval' for HMR; disable in prod
    isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "connect-src 'self' https:"
  ]
  res.headers.set('Content-Security-Policy', cspParts.join('; '))

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}