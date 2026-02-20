import { NextResponse } from 'next/server'

// ============================================
// API ROUTE: Admin Logout
// Method: POST
// Endpoint: /api/admin/logout
// ============================================

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Logout berhasil' },
      { status: 200 }
    )

    // Clear the admin_token cookie
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

