import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifySessionToken } from '@/lib/admin-auth'

// ============================================
// HELPER: Verify Admin Authentication
// ============================================

function verifyAdminAuth(request: NextRequest): { authorized: boolean; error?: string } {
  const token = request.cookies.get('admin_token')?.value

  if (!token) {
    return { authorized: false, error: 'Token tidak ditemukan' }
  }

  if (!verifySessionToken(token)) {
    return { authorized: false, error: 'Token expired atau tidak valid' }
  }

  return { authorized: true }
}

// ============================================
// GET: List All Reports
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const auth = verifyAdminAuth(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // Set admin role for RLS (though service role bypasses RLS, this is for consistency)
    await supabase.rpc('set_config', { parameter: 'request.user_role', value: 'admin' })

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const id = searchParams.get('id')

    // Get reports (single or multiple)
    let query = supabase
      .from('reports')
      .select('*, report_timeline(*), report_evidence(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // If ID is provided, get single report
    if (id) {
      query = supabase
        .from('reports')
        .select('*, report_timeline(*), report_evidence(*)')
        .eq('id', id)
        .limit(1)
    } else {
      // Apply multiple filters at once (status, category, search)
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      if (search) {
        query = query.ilike('title', `%${search}%`)
      }
    }

    // Apply pagination only for list (not single report)
    if (!id) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data laporan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        reports: reports || [],
        pagination: id ? null : {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH: Update Report Status
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin auth
    const auth = verifyAdminAuth(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    const body = await request.json()
    const { id, status, progress, addTimeline } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID laporan diperlukan' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    // Validate progress
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { success: false, error: 'Progress harus antara 0-100' },
        { status: 400 }
      )
    }

    // Build updates
    const updates: any = {}
    if (status) updates.status = status
    if (progress !== undefined) updates.progress = progress
    updates.updated_at = new Date().toISOString()

    // Update report
    const { error: updateError } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating report:', updateError)
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui laporan' },
        { status: 500 }
      )
    }

    // Add timeline entry if provided
    if (addTimeline) {
      const { error: timelineError } = await supabase
        .from('report_timeline')
        .insert({
          report_id: id,
          title: addTimeline.title,
          description: addTimeline.description || null,
          status: status || 'unknown',
          is_completed: true,
          is_active: addTimeline.isActive || false
        })

      if (timelineError) {
        console.error('Error adding timeline:', timelineError)
      }
    }

    // Get updated report
    const { data: updatedReport } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil diperbarui',
      data: updatedReport
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE: Delete Report
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin auth
    const auth = verifyAdminAuth(request)
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID laporan diperlukan' },
        { status: 400 }
      )
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      )
    }

    // Delete report (cascade akan hapus timeline)
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus laporan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Laporan berhasil dihapus'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
