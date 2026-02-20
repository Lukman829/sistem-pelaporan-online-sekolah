import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================
// MIDDLEWARE: Minimal - Let API routes handle their own auth
// Page routes are protected by client-side auth in layouts
// ============================================

export function middleware(request: NextRequest) {
  // Let all requests pass through
  // - Page routes (/dashboard, /reports) have client-side auth in layouts
  // - API routes have their own auth checks
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
