import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/admin-auth'

// ============================================
// API ROUTE: Admin Logout
// Method: POST/DELETE
// Endpoint: /api/admin/auth/logout
// ============================================

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil'
  })

  // Hapus cookie admin_token
  response.cookies.delete('admin_token')

  return response
}

// ============================================
// API ROUTE: Check Auth Status
// Method: GET
// Endpoint: /api/admin/auth/check
// ============================================

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, isAuthenticated: false, message: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const isValid = verifySessionToken(token)

    if (!isValid) {
      // Hapus cookie jika expired
      const response = NextResponse.json(
        { success: false, isAuthenticated: false, message: 'Token expired' },
        { status: 401 }
      )
      response.cookies.delete('admin_token')
      return response
    }

    return NextResponse.json({
      success: true,
      isAuthenticated: true
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, isAuthenticated: false, message: 'Error checking auth' },
      { status: 401 }
    )
  }
}

