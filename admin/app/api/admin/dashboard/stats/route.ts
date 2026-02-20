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
// GET: Dashboard Statistics
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

    // ========================================
    // 1. Get Total Reports Count
    // ========================================

    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })

    // ========================================
    // 2. Get Reports by Status
    // ========================================

    const { count: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: inProgressReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')

    const { count: resolvedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    const { count: closedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'closed')

    // ========================================
    // 3. Get Reports by Category
    // ========================================

    const { data: categoryData } = await supabase
      .from('reports')
      .select('category')

    const reportsByCategory = {
      bullying: 0,
      idea: 0
    }

    categoryData?.forEach((report) => {
      if (reportsByCategory.hasOwnProperty(report.category)) {
        reportsByCategory[report.category as keyof typeof reportsByCategory]++
      }
    })

    // ========================================
    // 4. Get Recent Reports (Last 10)
    // ========================================

    const { data: recentReports } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // ========================================
    // 5. Get Monthly Trends (Last 6 months)
    // ========================================

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: monthlyData } = await supabase
      .from('reports')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())

    const reportsByMonth: Record<string, number> = {}
    monthlyData?.forEach((report) => {
      const month = new Date(report.created_at).toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric'
      })
      reportsByMonth[month] = (reportsByMonth[month] || 0) + 1
    })

    // ========================================
    // 6. Build Response
    // ========================================

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalReports: totalReports || 0,
          pendingReports: pendingReports || 0,
          inProgressReports: inProgressReports || 0,
          resolvedReports: resolvedReports || 0,
          closedReports: closedReports || 0,
          resolutionRate: (totalReports ?? 0) > 0 
            ? Math.round(((resolvedReports ?? 0) / (totalReports ?? 1)) * 100) 
            : 0
        },
        byCategory: reportsByCategory,
        recentReports: recentReports || [],
        monthlyTrends: reportsByMonth,
        generatedAt: new Date().toISOString()
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

