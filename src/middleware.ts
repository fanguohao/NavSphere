import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth()

    if (!session?.user) {
      const callbackUrl = request.url
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
      )
    }

    const adminUser = process.env.ADMIN_USER || 'fanguohao'
    const username = (session.user as any).login || session.user.name || ''
    if (username !== adminUser) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=unauthorized', request.url)
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}