import { checkAuth } from "@/lib/admin-auth";
import { createServerClient } from "@/lib/supabase";
import DashboardClient from "./dashboard-client";

// ============================================
// TYPES
// ============================================

interface DashboardData {
  overview: {
    totalReports: number;
    pendingReports: number;
    inProgressReports: number;
    resolvedReports: number;
    closedReports: number;
    resolutionRate: number;
  };
  recentReports: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
    progress: number;
  }>;
  generatedAt: string;
}

// ============================================
// DATA FETCHING (Server-Side)
// ============================================

async function fetchDashboardData(): Promise<DashboardData | null> {
  try {
    const supabase = createServerClient();

    // 1. Get Total Reports Count
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    // 2. Get Reports by Status
    const { count: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: inProgressReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    const { count: resolvedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    const { count: closedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'closed');

    // 3. Get Recent Reports (Last 10)
    const { data: recentReports } = await supabase
      .from('reports')
      .select('id, title, category, status, created_at, progress')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate resolution rate
    const total = totalReports || 0;
    const resolved = resolvedReports || 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      overview: {
        totalReports: total,
        pendingReports: pendingReports || 0,
        inProgressReports: inProgressReports || 0,
        resolvedReports: resolved || 0,
        closedReports: closedReports || 0,
        resolutionRate
      },
      recentReports: recentReports || [],
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

// ============================================
// PAGE COMPONENT
// ============================================

export default async function DashboardPage() {
  // 1. Check authentication
  const auth = await checkAuth();
  
  if (!auth.authenticated) {
    // Redirect to login if not authenticated
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {auth.error || 'Sesi berakhir'}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Mengalihkan ke halaman login...
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch dashboard data
  const dashboardData = await fetchDashboardData();

  // 3. Render dashboard
  return (
    <DashboardClient 
      data={dashboardData || undefined}
      error={!dashboardData ? 'Gagal memuat data dashboard' : undefined}
      loading={false}
    />
  );
}

