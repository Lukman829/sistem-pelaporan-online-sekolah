import { NextRequest, NextResponse } from 'next/server'
import { adminLogin, verifySessionToken } from '@/lib/admin-auth'

// ============================================
// API ROUTE: Admin Login
// Method: POST
// Endpoint: /api/admin/auth/login
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // ========================================
    // 1. Validasi Input
    // ========================================

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email diperlukan' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password diperlukan' },
        { status: 400 }
      )
    }

    // ========================================
    // 2. Proses Login
    // ========================================

    const loginResult = await adminLogin(email, password)

    if (!loginResult.success) {
      return NextResponse.json(
        { success: false, error: loginResult.error },
        { status: 401 }
      )
    }

    // ========================================
    // 3. Create Response dengan Cookie
    // ========================================

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        email: email
        // Session cookie - expires when browser closes
      }
    })

    // Set HTTP-only cookie untuk keamanan (session cookie - expire saat browser ditutup)
    response.cookies.set('admin_token', loginResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
      // Tidak ada maxAge = session cookie
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// ============================================
// API ROUTE: Get Admin Status
// Method: GET
// Endpoint: /api/admin/auth/status
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Check cookie
    const token = request.cookies.get('admin_token')?.value

    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        { success: false, isAuthenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      isAuthenticated: true
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, isAuthenticated: false },
      { status: 401 }
    )
  }
}
