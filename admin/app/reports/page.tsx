"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportTable } from "@/components/report-table";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Report {
  id: string;
  access_key: string;
  title: string;
  category: string;
  status: string;
  progress: number;
  description?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  all: "Semua Kategori",
  bullying: "Bullying",
  idea: "Ide & Saran",
};

const statusLabels: Record<string, string> = {
  all: "Semua Status",
  pending: "Menunggu",
  in_progress: "Diproses",
  resolved: "Selesai",
  closed: "Ditutup",
};

function ReportsContent() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          setIsAuthenticated(false);
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/reports';
          router.replace('/login?redirect=' + encodeURIComponent(currentPath));
          return;
        }
        
        setIsAuthenticated(true);
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/reports';
        router.replace('/login?redirect=' + encodeURIComponent(currentPath));
      }
    };

    checkAuth();
  }, [router]);

  const fetchReports = async (status?: string, category?: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (status && status !== "all") {
        queryParams.set("status", status);
      }
      if (category && category !== "all") {
        queryParams.set("category", category);
      }
      queryParams.set("limit", "100");

      const response = await fetch(`/api/reports?${queryParams.toString()}`);
      const result = await response.json();

      if (result.success) {
        setReports(result.data.reports || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memuat laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      fetchReports(statusFilter, categoryFilter);
    }
  }, [statusFilter, categoryFilter, authChecked, isAuthenticated]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports(statusFilter, categoryFilter);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  // Helper to generate empty state message based on active filters
  const getEmptyMessage = () => {
    const activeFilters: string[] = [];
    
    if (statusFilter !== "all") {
      activeFilters.push(`status "${statusLabels[statusFilter]}"`);
    }
    if (categoryFilter !== "all") {
      activeFilters.push(`kategori "${categoryLabels[categoryFilter]}"`);
    }

    if (activeFilters.length === 0) {
      return {
        title: "Belum ada laporan",
        description: "Laporan akan muncul di sini setelah ada yang mengajukan."
      };
    }

    return {
      title: "Tidak ada laporan yang sesuai",
      description: `Tidak ada laporan dengan ${activeFilters.join(" dan ")}`
    };
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground">Kelola dan lihat semua laporan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter berdasarkan kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="bullying">Bullying</SelectItem>
                <SelectItem value="idea">Ide & Saran</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter berdasarkan status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="in_progress">Diproses</SelectItem>
                <SelectItem value="resolved">Selesai</SelectItem>
                <SelectItem value="closed">Ditutup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!authChecked || !isAuthenticated ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="ml-2 text-slate-600">Memuat...</span>
        </div>
      ) : (
        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Daftar Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportTable 
              initialReports={reports} 
              emptyMessage={loading ? null : getEmptyMessage()}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
