"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Calendar, Tag, Clock, AlertCircle, FileSearch, File, ImageIcon } from "lucide-react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import Timeline, { type TimelineItem } from "../../components/Timeline"
import ImageModal from "../../components/ImageModal"
import { getReportStatus } from "../../lib/api"
import styles from "../../modules/tracking.module.css"
import componentStyles from "../../modules/components.module.css"

interface ReportData {
  id: string
  title: string
  category: string
  status: "pending" | "in_progress" | "resolved" | "closed"
  statusLabel: string
  createdAt: string
  description: string
  location?: string
  progress: number
  timeline: TimelineItem[]
  evidence?: {
    id: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
    uploadedAt: string
    url: string
  }[]
}

const statusConfig = {
  pending: {
    label: "Laporan Diterima",
    className: styles.statusBadgePending,
  },
  in_progress: {
    label: "Sedang Diproses",
    className: styles.statusBadgeInProgress,
  },
  resolved: {
    label: "Selesai Ditangani",
    className: styles.statusBadgeResolved,
  },
  closed: {
    label: "Laporan Ditutup",
    className: styles.statusBadgeClosed,
  },
}

// Helper to get proxy URL for evidence
const getEvidenceProxyUrl = (filePath: string, accessKey: string): string => {
  const url = `/api/evidence/${filePath}?key=${accessKey}`
  return url
}

export default function CekStatusContent() {
  const [accessKey, setAccessKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessKey.trim()) return

    setIsLoading(true)
    setError("")
    setHasSearched(true)

    try {
      const result = await getReportStatus(accessKey)
      
      // Check for success and data
      if (result.success && result.data) {
        setReportData(result.data)
        setError("")
      } else {
        // Handle error case
        setReportData(null)
        setError(result.error || "Laporan tidak ditemukan. Pastikan kode akses yang Anda masukkan benar.")
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("Terjadi kesalahan saat mencari laporan. Silakan coba lagi.")
      setReportData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const openImageModal = (filePath: string, fileName: string) => {
    const proxyUrl = getEvidenceProxyUrl(filePath, accessKey)
    setSelectedImage({ url: proxyUrl, name: fileName })
    setModalOpen(true)
  }

  const closeImageModal = () => {
    setModalOpen(false)
    setSelectedImage(null)
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      bullying: "Bullying",
      idea: "Ide & Saran",
    }
    return categories[category] || category
  }

  return (
    <div className={styles.trackingPage}>
      <Header />
      <main className={styles.trackingMain}>
        <div className={styles.trackingContainer}>
          <div className={styles.trackingHeader}>
            <h1 className={styles.trackingTitle}>Cek Status Laporan</h1>
            <p className={styles.trackingSubtitle}>Masukkan kode akses untuk melihat status laporan Anda</p>
          </div>

          <div className={styles.searchCard}>
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <div className={styles.searchInputWrapper}>
                <Search size={20} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Masukkan kode akses 12 karakter"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                  maxLength={12}
                />
              </div>
              <button
                type="submit"
                className={`${componentStyles.button} ${componentStyles.buttonPrimary}`}
                disabled={isLoading || accessKey.length < 12}
              >
                {isLoading ? "Mencari..." : "Cari Laporan"}
              </button>
            </form>
            <p className={styles.searchHint}>Kode akses terdiri dari 12 karakter huruf dan angka</p>
          </div>

          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.loadingCard}
              >
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Mencari laporan...</p>
              </motion.div>
            )}

            {!isLoading && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.errorCard}
              >
                <div className={styles.errorIcon}>
                  <AlertCircle size={32} />
                </div>
                <h2 className={styles.errorTitle}>Laporan Tidak Ditemukan</h2>
                <p className={styles.errorDescription}>{error}</p>
                <button
                  className={`${componentStyles.button} ${componentStyles.buttonSecondary}`}
                  onClick={() => {
                    setError("")
                    setAccessKey("")
                    setHasSearched(false)
                  }}
                >
                  Coba Lagi
                </button>
              </motion.div>
            )}

            {!isLoading && !error && reportData && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.statusCard}
              >
                <div className={styles.statusHeader}>
                  <div className={styles.statusInfo}>
                    <h2>{reportData.title}</h2>
                    <div className={styles.statusMeta}>
                      <span className={styles.statusMetaItem}>
                        <Tag size={16} />
                        {getCategoryLabel(reportData.category)}
                      </span>
                      <span className={styles.statusMetaItem}>
                        <Calendar size={16} />
                        {reportData.createdAt}
                      </span>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${statusConfig[reportData.status].className}`}>
                    <Clock size={14} />
                    {statusConfig[reportData.status].label}
                  </span>
                </div>

                <div className={styles.statusBody}>
                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressTitle}>Progress Penanganan</span>
                      <span className={`${styles.progressBadge} ${
                        reportData.progress >= 80 ? styles.progressBadgeHigh :
                        reportData.progress >= 40 ? styles.progressBadgeMedium :
                        styles.progressBadgeLow
                      }`}>
                        {reportData.progress}%
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={`${styles.progressFill} ${
                          reportData.progress >= 80 ? styles.progressFillHigh :
                          reportData.progress >= 40 ? styles.progressFillMedium :
                          styles.progressFillLow
                        }`} 
                        style={{ width: `${reportData.progress}%` }} 
                      />
                    </div>
                    <p className={styles.progressHint}>
                      {reportData.progress === 0 && "Laporan baru diterima, menunggu penanganan"}
                      {reportData.progress > 0 && reportData.progress < 30 && "Sedang dalam tahap verifikasi awal"}
                      {reportData.progress >= 30 && reportData.progress < 60 && "Sedang dalam proses penanganan"}
                      {reportData.progress >= 60 && reportData.progress < 90 && "Hampir selesai ditangani"}
                      {reportData.progress >= 90 && reportData.progress < 100 && "Finalisasi penanganan"}
                      {reportData.progress === 100 && "Penanganan selesai"}
                    </p>
                  </div>

                  <div className={styles.statusSection}>
                    <h3 className={styles.statusSectionTitle}>Deskripsi</h3>
                    <p className={styles.statusDescription}>{reportData.description}</p>
                  </div>

                  <div className={styles.statusSection}>
                    <h3 className={styles.statusSectionTitle}>Lokasi</h3>
                    <p className={styles.statusDescription}>
                      {reportData.location || "Tidak ada lokasi yang dicantumkan"}
                    </p>
                  </div>

                  <div className={styles.statusSection}>
                    <h3 className={styles.statusSectionTitle}>Bukti/Gambar Terlampir</h3>
                    {reportData.evidence && reportData.evidence.length > 0 ? (
                      <div className={styles.evidenceGrid}>
                        {reportData.evidence.map((item) => {
                          const isImage = item.mimeType?.startsWith('image/')
                          const proxyUrl = getEvidenceProxyUrl(item.filePath, accessKey)
                          
                          return (
                            <div key={item.id} className={styles.evidenceItem}>
                              {isImage ? (
                                <div 
                                  className={styles.evidenceImageContainer}
                                  onClick={() => openImageModal(item.filePath, item.fileName)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <img 
                                    src={proxyUrl} 
                                    alt={item.fileName}
                                    className={styles.evidenceImage}
                                    onError={(e) => {
                                      // On error, show fallback
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      const fallback = target.nextElementSibling as HTMLElement
                                      if (fallback) fallback.style.display = 'flex'
                                    }}
                                  />
                                  <div className={styles.evidenceImageFallback} style={{ display: 'none' }}>
                                    <ImageIcon size={32} className={styles.evidenceIcon} />
                                    <span className={styles.evidenceFileName}>{item.fileName}</span>
                                    <span className={styles.evidenceError}>Bukti tidak tersedia</span>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.evidenceFile}>
                                  <File size={32} className={styles.evidenceIcon} />
                                  <span className={styles.evidenceFileName}>{item.fileName}</span>
                                  <span className={styles.evidenceFileSize}>
                                    {(item.fileSize / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              )}
                              <div className={styles.evidenceFooter}>
                                <span className={styles.evidenceFileSize}>
                                  {(item.fileSize / 1024).toFixed(1)} KB
                                </span>
                                {isImage && (
                                  <button
                                    onClick={() => openImageModal(item.filePath, item.fileName)}
                                    className={styles.evidencePreviewButton}
                                  >
                                    Preview
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className={styles.noEvidence}>
                        <ImageIcon size={48} className={styles.noEvidenceIcon} />
                        <p className={styles.noEvidenceText}>Tidak ada gambar terlampir</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.statusSection}>
                    <h3 className={styles.statusSectionTitle}>Riwayat Status</h3>
                    <Timeline items={reportData.timeline} />
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoading && !error && !reportData && !hasSearched && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                <div className={styles.emptyIcon}>
                  <FileSearch size={40} />
                </div>
                <h2 className={styles.emptyTitle}>Masukkan Kode Akses</h2>
                <p className={styles.emptyDescription}>
                  Gunakan kode akses 12 karakter yang Anda terima saat mengirim laporan untuk melihat statusnya.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={closeImageModal}
        imageUrl={selectedImage?.url || ""}
        fileName={selectedImage?.name}
      />
    </div>
  )
}
