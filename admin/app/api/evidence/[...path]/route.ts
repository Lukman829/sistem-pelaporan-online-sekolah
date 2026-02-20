import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifySessionToken } from '@/lib/admin-auth'

// ============================================
// API ROUTE: Serve Evidence Files (Proxy with Auth)
// Method: GET
// Endpoint: /api/evidence/[filePath]
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 1. AUTH CHECK - Verify admin has valid session
    const token = request.cookies.get('admin_token')?.value
    
    // Also allow access if they have the report access key in query (for shared reports)
    const { searchParams } = new URL(request.url)
    const accessKey = searchParams.get('key')
    
    // Simple auth: either has valid admin token OR provides access key
    const hasAuth = (token && verifySessionToken(token)) || !!accessKey
    
    if (!hasAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login or provide access key.' },
        { status: 401 }
      )
    }

    // 2. Reconstruct file path from URL segments
    const resolvedParams = await params
    const pathSegments = resolvedParams.path || []
    const filePath = pathSegments.join('/')
    
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path diperlukan' },
        { status: 400 }
      )
    }

    // 3. Use admin client with service role
    const supabase = createServerClient()

    // 4. Download file using service role (can access private files)
    const { data, error } = await supabase.storage
      .from('evidence')
      .download(filePath)

    if (error) {
      console.error('Error downloading file:', error)
      // Return a placeholder image instead of JSON error for image requests
      const ext = filePath.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        // Return a 1x1 transparent pixel as fallback
        const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
        return new NextResponse(transparentPixel, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache',
          },
        })
      }
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 404 }
      )
    }

    // 5. Determine content type from file extension
    const ext = filePath.split('.').pop()?.toLowerCase()
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
    }
    
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

    // 6. Return file with proper headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
      },
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
