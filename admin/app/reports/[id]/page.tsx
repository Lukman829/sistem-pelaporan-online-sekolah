"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Image as ImageIcon, File, MapPin, Calendar, Clock, Tag, FileText, Info, Edit2, Save, X, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ImageModal from "@/components/ImageModal";

const getEvidenceProxyUrl = (filePath: string, accessKey: string): string => {
  return `/api/evidence/${filePath}?key=${accessKey}`;
};

interface Report {
  id: string;
  access_key: string;
  title: string;
  category: string;
  description: string;
  location?: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
  evidence?: any[];
}

function ReportDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          setIsAuthenticated(false);
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/reports/${params.id || ''}`;
          router.replace('/login?redirect=' + encodeURIComponent(currentPath));
          return;
        }
        
        setIsAuthenticated(true);
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/reports/${params.id || ''}`;
        router.replace('/login?redirect=' + encodeURIComponent(currentPath));
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (authChecked && isAuthenticated && params.id) {
      fetchReportDetails();
    }
  }, [authChecked, isAuthenticated, params.id]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports?id=${params.id}`);
      const result = await response.json();

      if (result.success && result.data.reports?.[0]) {
        const reportData = result.data.reports[0];
        const mappedReport = {
          ...reportData,
          evidence: reportData.report_evidence || []
        };
        setReport(mappedReport);
        setEditStatus(mappedReport.status);
        setEditProgress(mappedReport.progress);
      } else {
        toast({
          title: "Error",
          description: result.error || "Laporan tidak ditemukan",
          variant: "destructive",
        });
        router.push("/reports");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast({
        title: "Error",
        description: "Gagal memuat detail laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (filePath: string, fileName: string) => {
    if (!report?.access_key) {
      toast({
        title: "Error",
        description: "Access key tidak tersedia",
        variant: "destructive",
      });
      return;
    }
    const proxyUrl = getEvidenceProxyUrl(filePath, report.access_key);
    setSelectedImage({ url: proxyUrl, name: fileName });
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditStatus(report?.status || "pending");
    setEditProgress(report?.progress || 0);
    setEditNote("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditNote("");
  };

  const getProgressColor = (progress: number) => {
    if (progress <= 35) return 'bg-red-500'
    if (progress <= 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const handleSaveEdit = async () => {
    if (!report) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: report.id,
          status: editStatus,
          progress: editProgress,
          addTimeline: editNote ? {
            title: 'Update dari Admin',
            description: editNote,
            isActive: false
          } : undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReport({
          ...report,
          status: editStatus,
          progress: editProgress,
          updated_at: new Date().toISOString()
        });
        setIsEditing(false);
        setEditNote("");
        toast({
          title: "Berhasil",
          description: "Laporan berhasil diperbarui",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memperbarui laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui laporan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked || !isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Laporan tidak ditemukan</p>
        <Link href="/reports">
          <Button variant="link" className="mt-2">
            Kembali ke daftar laporan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold truncate">{report.title}</h1>
          <p className="text-sm text-muted-foreground">
            Kode Akses: <span className="font-mono">{report.access_key}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Deskripsi Laporan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-hidden">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                {report.description || "Tidak ada deskripsi"}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5" />
                Bukti/Gambar Terlampir
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 overflow-hidden">
              {report.evidence && report.evidence.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 min-w-0 max-w-full">
                  {report.evidence.map((item: any) => {
                    const isImage = item.mime_type?.startsWith('image/');
                    const proxyUrl = getEvidenceProxyUrl(item.file_path, report.access_key);
                    
                    return (
                      <div key={item.id} className="border rounded-lg overflow-hidden hover:border-emerald-500 transition-colors bg-white min-w-0">
                        {isImage ? (
                          <div 
                            className="relative w-full h-32 bg-slate-100 cursor-pointer overflow-hidden"
                            onClick={() => openImageModal(item.file_path, item.file_name)}
                          >
                            <img 
                              src={proxyUrl} 
                              alt={item.file_name}
                              className="w-full h-32 object-cover max-w-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-32 flex-col items-center justify-center p-4 text-center bg-slate-200">
                              <div className="text-3xl mb-2 opacity-50">🖼️</div>
                              <span className="text-xs text-slate-500 break-all line-clamp-2">
                                Bukti tidak tersedia
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
                            <File className="h-8 w-8 text-slate-300 mb-2" />
                            <span className="text-xs text-slate-500 break-all line-clamp-2">
                              {item.file_name}
                            </span>
                          </div>
                        )}
                        <div className="p-2 bg-slate-50 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 truncate flex-1 mr-2">
                              {(item.file_size / 1024).toFixed(1)} KB
                            </span>
                            {isImage && (
                              <button
                                onClick={() => openImageModal(item.file_path, item.file_name)}
                                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1 rounded transition-colors"
                              >
                                Preview
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <ImageIcon className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500 italic">Tidak ada gambar terlampir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5" />
                Informasi Laporan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Kategori</p>
                    <p className="text-sm font-semibold text-gray-200">{report.category}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Lokasi</p>
                    <p className="text-sm font-semibold text-gray-200">{report.location || "Tidak ditentukan"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400">Status</p>
                    <p className="text-sm font-semibold text-gray-200 capitalize">{report.status}</p>
                    <div className="mt-1">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${getProgressColor(report.progress)}`}
                          style={{ width: `${report.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{report.progress}% selesai</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Dibuat pada</p>
                    <p className="text-sm font-semibold text-gray-200">
                      {new Date(report.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400">Terakhir diupdate</p>
                    <p className="text-sm font-semibold text-gray-200">
                      {new Date(report.updated_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Edit2 className="h-5 w-5" />
                Update Status
              </CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                    <X className="h-4 w-4 mr-1" />
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Simpan
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {!isEditing ? (
                <p className="text-sm text-slate-500">Klik "Edit" untuk mengubah status dan progress laporan.</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500">Status</label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-xs font-medium text-slate-500">Progress</label>
                      <span className="text-xs font-medium text-emerald-600">{editProgress}%</span>
                    </div>
                    <Slider
                      value={[editProgress]}
                      onValueChange={(value) => setEditProgress(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full rounded-full transition-all ${getProgressColor(editProgress)}`}
                        style={{ width: `${editProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Catatan Admin (Opsional)
                    </label>
                    <Textarea
                      placeholder="Tambahkan catatan update..."
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                    <p className="text-xs text-slate-400">Catatan akan ditambahkan ke timeline laporan</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageModal
        isOpen={modalOpen}
        onClose={closeImageModal}
        imageUrl={selectedImage?.url || ""}
        fileName={selectedImage?.name}
      />
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <ReportDetailContent />
    </Suspense>
  );
}
