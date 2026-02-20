"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle, AlertTriangle, ChevronRight, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

// Status mapping for consistent display
const statusConfig = {
  pending: { label: "Menunggu", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  in_progress: { label: "Diproses", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: AlertTriangle },
  resolved: { label: "Selesai", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  closed: { label: "Ditutup", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: FileText },
};

// Category mapping
const categoryConfig = {
  bullying: { label: "Bullying", color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" },
  idea: { label: "Ide & Saran", color: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
}

function StatCard({ label, value, icon, trend, trendUp, onClick }: StatCardProps) {
  return (
    <Card 
      className="cursor-pointer border-0 bg-white shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md hover:ring-emerald-200 dark:bg-slate-900 dark:ring-slate-800/50 dark:hover:ring-emerald-800/30"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            {trend && (
              <p className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend} dari kemarin
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-800/50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 w-full">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </div>
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

interface Report {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  progress: number;
}

interface DashboardData {
  overview: {
    totalReports: number;
    pendingReports: number;
    inProgressReports: number;
    resolvedReports: number;
    closedReports: number;
    resolutionRate: number;
  };
  recentReports: Report[];
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const config = categoryConfig[category as keyof typeof categoryConfig];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function RecentReportsList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <FileText className="h-7 w-7 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">Belum ada laporan</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Laporan akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div 
          key={report.id}
          className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800/30 cursor-pointer"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate leading-tight">
              {report.title}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={report.category} />
              <StatusBadge status={report.status} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{report.progress}%</span>
              <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700">
                <div 
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${report.progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {new Date(report.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short'
              })}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Mobile list skeleton */}
      <div className="space-y-3 lg:hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        ))}
      </div>
      {/* Desktop table skeleton */}
      <div className="hidden lg:block space-y-4">
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          {[100, 80, 80, 80, 120].map((width, i) => (
            <Skeleton key={i} className="h-4" style={{ width }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-6" style={{ width: '30%' }} />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface DashboardClientProps {
  data?: DashboardData;
  error?: string;
  loading?: boolean;
}

export default function DashboardClient({ data, error, loading }: DashboardClientProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate completion rate for display
  const completionRate = data?.overview.resolutionRate || 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ringkasan aktivitas dan statistik laporan
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Statistics Cards - Responsive Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Laporan"
              value={data?.overview.totalReports || 0}
              icon={<FileText className="h-5 w-5 sm:h-6 sm:w-6" />}
              trend="+12%"
              trendUp={true}
            />
            <StatCard
              label="Menunggu"
              value={data?.overview.pendingReports || 0}
              icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6" />}
            />
            <StatCard
              label="Diproses"
              value={data?.overview.inProgressReports || 0}
              icon={<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />}
            />
            <StatCard
              label="Selesai"
              value={data?.overview.resolvedReports || 0}
              icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
            />
          </>
        )}
      </div>

      {/* Recent Reports Card */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-800/50">
        <CardHeader className="border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Laporan Terbaru
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {data?.recentReports.length || 0} laporan dalam sistem
              </p>
            </div>
            <a
              href="/reports"
              className="flex items-center gap-1 text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 whitespace-nowrap"
            >
              Lihat semua
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <TableSkeleton />
          ) : (
            <RecentReportsList reports={data?.recentReports || []} />
          )}
        </CardContent>
      </Card>

      {/* Resolution Rate Card */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-800/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-center justify-center py-4 text-center sm:flex-row sm:justify-between sm:text-left gap-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Tingkat Penyelesaian</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{completionRate}%</p>
            </div>
            <div className="w-full sm:w-48 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

