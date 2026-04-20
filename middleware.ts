import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const isLoginPage = pathname === '/admin/login'
  const isAdminPage = pathname.startsWith('/admin')
  const isApiAdmin = pathname.startsWith('/api/admin')

  if (isLoginPage) {
    if (token) return NextResponse.redirect(new URL('/admin', req.url))
    return NextResponse.next()
  }

  if ((isAdminPage || isApiAdmin) && !token) {
    if (isApiAdmin) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    const loginUrl = new URL('/admin/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
