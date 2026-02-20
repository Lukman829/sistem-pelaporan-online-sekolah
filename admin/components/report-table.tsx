"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { 
  Eye, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Loader2
} from "lucide-react";
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

interface ReportTableProps {
  initialReports?: Report[];
  showActions?: boolean;
  emptyMessage?: {
    title: string;
    description: string;
  } | null;
}

const statusOptions = [
  { value: "pending", label: "Menunggu", icon: Clock, color: "from-amber-400 to-orange-500", bgColor: "bg-amber-500/20", borderColor: "border-amber-500/50", textColor: "text-amber-300" },
  { value: "in_progress", label: "Diproses", icon: AlertTriangle, color: "from-blue-400 to-cyan-500", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/50", textColor: "text-blue-300" },
  { value: "resolved", label: "Selesai", icon: CheckCircle, color: "from-emerald-400 to-teal-500", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/50", textColor: "text-emerald-300" },
  { value: "closed", label: "Ditutup", icon: XCircle, color: "from-rose-400 to-pink-500", bgColor: "bg-rose-500/20", borderColor: "border-rose-500/50", textColor: "text-rose-300" },
];

const categoryLabels: Record<string, string> = {
  bullying: "Bullying",
  idea: "Ide & Saran",
};

export function ReportTable({ initialReports = [], showActions = true, emptyMessage }: ReportTableProps) {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [loading, setLoading] = useState(!initialReports.length);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newProgress, setNewProgress] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports?limit=100");
      const result = await response.json();
      
      if (result.success) {
        setReports(result.data.reports || []);
      } else {
        toast({
          title: "Terjadi Kesalahan",
          description: result.error || "Gagal memuat laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReports.length === 0) {
      fetchReports();
    }
  }, [initialReports.length]);

  const handleEditClick = (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setNewProgress(report.progress);
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;

    setUpdating(true);
    try {
      const timelineTitles: Record<string, string> = {
        pending: "Status Diubah ke Menunggu",
        in_progress: "Laporan Sedang Diproses",
        resolved: "Laporan Selesai Diproses",
        closed: "Laporan Ditutup",
      };

      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReport.id,
          status: newStatus,
          progress: newProgress,
          addTimeline: {
            title: timelineTitles[newStatus] || "Status Diperbarui",
            description: `Status diubah dari ${selectedReport.status} ke ${newStatus}`,
            isActive: newStatus === "in_progress",
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Status laporan berhasil diperbarui",
        });
        setEditDialogOpen(false);
        fetchReports();
      } else {
        toast({
          title: "Terjadi Kesalahan",
          description: result.error || "Gagal memperbarui status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Terjadi kesalahan saat memperbarui",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = async (report: Report) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus laporan "${report.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/reports?id=${report.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Laporan berhasil dihapus",
        });
        fetchReports();
      } else {
        toast({
          title: "Terjadi Kesalahan",
          description: result.error || "Gagal menghapus laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Terjadi kesalahan saat menghapus",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getProgressGradient = (progress: number) => {
    if (progress <= 35) {
      return 'bg-gradient-to-r from-red-500 to-orange-500';
    } else if (progress <= 70) {
      return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    } else {
      return 'bg-gradient-to-r from-emerald-400 to-teal-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress <= 35) return '#ef4444';
    if (progress <= 70) return '#fbbf24';
    return '#10b981';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  if (reports.length === 0) {
    // Use custom message if provided, otherwise use default
    const message = emptyMessage || {
      title: "Belum ada laporan",
      description: "Laporan akan muncul di sini setelah ada yang mengajukan."
    };
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{message.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {message.description}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold">Judul</TableHead>
              <TableHead className="font-semibold">Kategori</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Progress</TableHead>
              <TableHead className="font-semibold">Dibuat</TableHead>
              {showActions && <TableHead className="text-right font-semibold">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {report.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {categoryLabels[report.category] || report.category}
                </TableCell>
                <TableCell>
                  <StatusBadge status={report.status as any} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getProgressGradient(report.progress)}`}
                        style={{ width: `${report.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300">
                      {report.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(report.created_at)}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/reports/${report.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(report)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Status
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(report)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Status Laporan</DialogTitle>
            <DialogDescription>
              Ubah status dan progress laporan "{selectedReport?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = newStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewStatus(option.value)}
                      className={`group relative flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg ${
                        isSelected
                          ? `${option.bgColor} ${option.borderColor} ${option.textColor} shadow-lg scale-105`
                          : "border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-700/50 hover:text-slate-200"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${option.color} ${isSelected ? 'shadow-md' : 'opacity-60 group-hover:opacity-100'} transition-all duration-300`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>{option.label}</span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-white to-slate-300 rounded-full shadow-md" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-200">Progress</label>
                <span className={`text-sm font-semibold ${getProgressGradient(newProgress).replace('bg-gradient-to-r', 'text-transparent bg-clip-text bg-gradient-to-r')}`}>{newProgress}%</span>
              </div>
              <div className="relative py-6 px-1">
                {/* Glossy glass trail track */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-full shadow-inner border border-slate-600/50 overflow-hidden">
                  {/* Glass shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>
                
                {/* Slow glossy trail marks */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-3 pointer-events-none">
                  {[...Array(8)].map((_, i) => {
                    const position = Math.max(0, newProgress - (i + 1) * 5);
                    const opacity = Math.max(0.05, 0.4 - (i * 0.05));
                    const scale = Math.max(0.5, 1 - (i * 0.1));
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
                        style={{
                          left: `${position}%`,
                          width: `${12 - i}px`,
                          height: `${12 - i}px`,
                          backgroundColor: getProgressColor(newProgress),
                          opacity: opacity,
                          transform: `translateY(-50%) scale(${scale})`,
                          boxShadow: `0 0 ${8 - i}px ${getProgressColor(newProgress)}, inset 0 0 4px rgba(255,255,255,0.3)`,
                          filter: 'blur(1px)',
                          transitionDelay: `${i * 50}ms`
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Main slider */}
                <Slider
                  value={[newProgress]}
                  onValueChange={(values) => setNewProgress(values[0])}
                  max={100}
                  step={5}
                  className="relative z-10"
                />
                
                {/* Glossy thumb glow */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full pointer-events-none transition-all duration-500"
                  style={{ 
                    left: `calc(${newProgress}% - 12px)`,
                    background: `radial-gradient(circle, ${getProgressColor(newProgress)} 0%, transparent 70%)`,
                    opacity: 0.6,
                    filter: 'blur(4px)'
                  }}
                />
              </div>
              
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getProgressGradient(newProgress)}`}
                  style={{ width: `${newProgress}%` }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <button 
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
              className="group relative px-6 py-2.5 rounded-xl border-2 border-slate-500 bg-slate-800/50 text-slate-300 font-medium transition-all duration-300 ease-out hover:scale-105 hover:border-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:shadow-lg hover:shadow-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
                Batal
              </span>
            </button>
            <button 
              onClick={handleUpdateStatus}
              disabled={updating || !newStatus}
              className={`group relative px-6 py-2.5 rounded-xl font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                newStatus 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/30' 
                  : 'bg-slate-600'
              }`}
            >
              <span className="flex items-center gap-2">
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 transition-transform group-hover:scale-110 duration-300" />
                    Simpan Perubahan
                  </>
                )}
              </span>
              {newStatus && !updating && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
