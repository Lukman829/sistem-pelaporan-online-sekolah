"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  Lightbulb,
  Upload,
  FileText,
  X,
  CheckCircle,
  Copy,
  AlertCircle,
  Info,
} from "lucide-react"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import Stepper from "../../components/Stepper"
import { submitReports, generateAccessKey } from "../../lib/api"
import styles from "../../modules/form.module.css"
import componentStyles from "../../modules/components.module.css"

const categories = [
  {
    id: "bullying",
    label: "Bullying",
    icon: AlertTriangle,
    description: "Perundungan fisik, verbal, atau cyber",
  },
  {
    id: "idea",
    label: "Ide & Saran",
    icon: Lightbulb,
    description: "Usulan untuk perbaikan sekolah",
  },
]

const locationOptions = [
  { id: "kantin", label: "Kantin" },
  { id: "lapangan", label: "Lapangan" },
  { id: "kelas", label: "Kelas" },
  { id: "perpustakaan", label: "Perpustakaan" },
  { id: "lainnya", label: "Lainnya" },
]

const steps = [
  { id: 1, label: "Kategori" },
  { id: 2, label: "Detail" },
  { id: 3, label: "Konfirmasi" },
]

interface CategoryInputProps {
  cat: {
    id: "bullying" | "idea"
    label: string
    icon: React.ElementType
  }
  category: "bullying" | "idea" | ""
  onChange: (value: "bullying" | "idea") => void
}

function CategoryInput({ cat, category, onChange }: CategoryInputProps) {
  return (
    <label
      className={`${styles.categoryCard} ${category === cat.id ? styles.categoryCardSelected : ""}`}
    >
      <input
        type="radio"
        name="category"
        value={cat.id}
        checked={category === cat.id}
        onChange={(e) => onChange(e.target.value as "bullying" | "idea")}
        className={styles.categoryInput}
      />
      <div className={styles.categoryIcon}>
        <cat.icon size={24} />
      </div>
      <span className={styles.categoryLabel}>{cat.label}</span>
    </label>
  )
}

interface FileWithPreview extends File {
  preview?: string
}

export default function LaporPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [category, setCategory] = useState<"bullying" | "idea" | "">("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [locationType, setLocationType] = useState("")
  const [locationDetail, setLocationDetail] = useState("")
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accessKey, setAccessKey] = useState("")
  const [copied, setCopied] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const getFormattedLocation = () => {
    if (!locationType) return ""
    const option = locationOptions.find((opt) => opt.id === locationType)
    if (!option) return ""
    
    if (locationType === "kelas") {
      return locationDetail ? `Kelas: ${locationDetail}` : "Kelas"
    } else if (locationType === "lainnya") {
      return locationDetail || "Lainnya"
    }
    return option.label
  }

  const MAX_TOTAL_SIZE = 5 * 1024 * 1024 // 5MB total for all files

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Calculate total size of existing files
      const existingTotalSize = files.reduce((sum, file) => sum + file.size, 0)
      
      // Calculate total size of new files
      const newTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0)
      
      // Check if total size exceeds limit
      if (existingTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
        setFileError("Maksimal file 5MB")
        return
      }
      
      setFileError(null)
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFileError(null) // Clear error when file is removed
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const key = generateAccessKey()
      await submitReports({
        category: category as "bullying" | "idea",
        title,
        description,
        location: getFormattedLocation(),
        files,
        accessKey: key,
      })
      setAccessKey(key)
      setCurrentStep(4)
    } catch (error) {
      console.error("Error submitting report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = useCallback(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }
    
    // Check if clipboard API is available (may not work on non-HTTPS or IP-based URLs)
    if (!navigator.clipboard) {
      // Fallback: select text and use execCommand
      try {
        const textArea = document.createElement('textarea')
        textArea.value = accessKey
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } else {
          alert(`Kode akses Anda: ${accessKey}\nSilakan salin secara manual.`)
        }
      } catch (err) {
        alert(`Kode akses Anda: ${accessKey}\nSilakan salin secara manual.`)
      }
      return
    }
    
    // Use Clipboard API
    navigator.clipboard.writeText(accessKey)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Fallback if clipboard fails
        alert(`Kode akses Anda: ${accessKey}\nSilakan salin secara manual.`)
      })
  }, [accessKey])

  const canProceed = () => {
    if (currentStep === 1) return category !== ""
    if (currentStep === 2) {
      const isLocationValid = locationType !== "" && 
        (locationType !== "kelas" && locationType !== "lainnya" || locationDetail.trim() !== "")
      const isDescriptionValid = description.trim().length >= 55
      const isTitleValid = title.trim().length >= 7
      return isTitleValid && isDescriptionValid && isLocationValid
    }
    return true
  }

  const getLocationError = () => {
    if (!showValidation) return ""
    if (locationType === "") return "Pilih lokasi kejadian"
    if ((locationType === "kelas" || locationType === "lainnya") && locationDetail.trim() === "") {
      return locationType === "kelas" ? "Masukkan nama kelas" : "Masukkan detail lokasi"
    }
    return ""
  }

  const getDescriptionError = () => {
    if (!showValidation) return ""
    if (description.trim().length < 55) return `Deskripsi minimal 55 karakter (saat ini ${description.trim().length} karakter)`
    return ""
  }

  const getTitleError = () => {
    if (!showValidation) return ""
    if (title.trim().length < 7) return `Judul minimal 7 karakter (saat ini ${title.trim().length} karakter)`
    return ""
  }

  return (
    <div className={styles.formPage}>
      <Header />
      <main className={styles.formMain}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Buat Laporan</h1>
            <p className={styles.formSubtitle}>Suarakan aspirasimu secara anonim dan aman</p>
          </div>

          {currentStep < 4 && <Stepper steps={steps} currentStep={currentStep} />}

          <div className={styles.formCard}>
            <AnimatePresence mode="wait">
              {/* Step 1: Category Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className={styles.stepTitle}>Pilih Kategori Laporan</h2>
                  <div className={styles.categoryGrid}>
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className={`${styles.categoryCard} ${category === cat.id ? styles.categoryCardSelected : ""}`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={cat.id}
                          checked={category === cat.id}
                          onChange={(e) => setCategory(e.target.value as "bullying" | "idea")}
                          className={styles.categoryInput}
                        />
                        <div className={styles.categoryIcon}>
                          <cat.icon size={24} />
                        </div>
                        <span className={styles.categoryLabel}>{cat.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className={styles.privacyNotice}>
                    <Info size={20} />
                    <p className={styles.privacyNoticeText}>
                      Laporan Anda sepenuhnya anonim. Kami tidak menyimpan data pribadi.
                    </p>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      className={`${componentStyles.button} ${componentStyles.buttonPrimary}`}
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceed()}
                    >
                      Lanjutkan
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Report Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className={styles.stepTitle}>Detail Laporan</h2>

                  <div className={styles.formGroup}>
                    <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Judul Laporan</label>
                    <input
                      type="text"
                      className={`${styles.input} ${getTitleError() ? styles.inputError : ""}`}
                      placeholder="Ringkasan singkat masalah atau saran"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                    <p className={`${styles.formHint} ${getTitleError() ? styles.formHintError : title.trim().length >= 7 ? styles.formHintSuccess : ""}`}>
                      {title.trim().length}/100 karakter {title.trim().length < 7 ? `(minimal 7 karakter)` : "✓"}
                    </p>
                    {getTitleError() && <p className={styles.formHintError}>{getTitleError()}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Deskripsi Lengkap</label>
                    <textarea
                      className={`${styles.input} ${styles.textarea} ${getDescriptionError() ? styles.inputError : ""}`}
                      placeholder="Jelaskan secara detail apa yang terjadi, kapan, dan informasi relevan lainnya..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                    />
                    <p className={`${styles.formHint} ${getDescriptionError() ? styles.formHintError : description.trim().length >= 55 ? styles.formHintSuccess : ""}`}>
                      {description.trim().length}/2000 karakter {description.trim().length < 55 ? `(minimal 55 karakter)` : "✓"}
                    </p>
                    {getDescriptionError() && <p className={styles.formHintError}>{getDescriptionError()}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Lokasi Kejadian</label>
                    <select
                      className={`${styles.select} ${getLocationError() && locationType === "" ? styles.selectError : ""}`}
                      value={locationType}
                      onChange={(e) => {
                        setLocationType(e.target.value)
                        setLocationDetail("")
                      }}
                    >
                      <option value="">Pilih lokasi...</option>
                      {locationOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {getLocationError() && locationType === "" && <p className={styles.formHintError}>{getLocationError()}</p>}
                    
                    {locationType === "kelas" && (
                      <div className={styles.conditionalInput}>
                        <label className={styles.formLabel}>Nama Kelas</label>
                        <input
                          type="text"
                          className={`${styles.input} ${getLocationError() && locationDetail.trim() === "" ? styles.inputError : ""}`}
                          placeholder="Contoh: 10 TKJ 1, 11 TKJ 1, dll..."
                          value={locationDetail}
                          onChange={(e) => setLocationDetail(e.target.value)}
                        />
                        {getLocationError() && locationDetail.trim() === "" && <p className={styles.formHintError}>{getLocationError()}</p>}
                      </div>
                    )}
                    
                    {locationType === "lainnya" && (
                      <div className={styles.conditionalInput}>
                        <label className={styles.formLabel}>Detail Lokasi</label>
                        <input
                          type="text"
                          className={`${styles.input} ${getLocationError() && locationDetail.trim() === "" ? styles.inputError : ""}`}
                          placeholder="Masukkan detail lokasi..."
                          value={locationDetail}
                          onChange={(e) => setLocationDetail(e.target.value)}
                        />
                        {getLocationError() && locationDetail.trim() === "" && <p className={styles.formHintError}>{getLocationError()}</p>}
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bukti Pendukung (Opsional)</label>
                    <div className={`${styles.fileUpload} ${fileError ? styles.fileUploadError : ""}`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                      />
                      <Upload size={32} className={styles.fileUploadIcon} />
                      <p className={styles.fileUploadText}>
                        <span>Klik untuk upload</span> atau drag & drop
                      </p>
                      <p className={styles.fileUploadHint}>PNG, JPG, PDF hingga 5MB (max 5 file)</p>
                    </div>
                    {fileError && <p className={styles.formHintError}>{fileError}</p>}

                    {files.length > 0 && (
                      <div className={styles.uploadedFiles}>
                        {files.map((file, index) => (
                          <div key={index} className={styles.uploadedFile}>
                            <FileText size={20} className={styles.uploadedFileIcon} />
                            <span className={styles.uploadedFileName}>{file.name}</span>
                            <span className={styles.uploadedFileSize}>{formatFileSize(file.size)}</span>
                            <button
                              type="button"
                              className={styles.uploadedFileRemove}
                              onClick={() => removeFile(index)}
                              aria-label={`Hapus ${file.name}`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.formActions}>
                    <button
                      className={`${componentStyles.button} ${componentStyles.buttonSecondary}`}
                      onClick={() => setCurrentStep(1)}
                    >
                      Kembali
                    </button>
                    <button
                      className={`${componentStyles.button} ${componentStyles.buttonPrimary}`}
                      onClick={() => {
                        setShowValidation(true)
                        if (canProceed()) {
                          setCurrentStep(3)
                        }
                      }}
                    >
                      Lanjutkan
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className={styles.stepTitle}>Konfirmasi Laporan</h2>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Kategori</label>
                    <p style={{ color: "var(--color-slate-navy)" }}>
                      {categories.find((c) => c.id === (category as "bullying" | "idea"))?.label}
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Judul</label>
                    <p style={{ color: "var(--color-slate-navy)" }}>{title}</p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Deskripsi</label>
                    <p className={styles.confirmationText}>
                      {description}
                    </p>
                  </div>

                  {locationType && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Lokasi</label>
                      <p style={{ color: "var(--color-slate-navy)" }}>{getFormattedLocation()}</p>
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Lampiran</label>
                      <p style={{ color: "var(--color-slate-navy)" }}>{files.length} file terlampir</p>
                    </div>
                  )}

                  <div className={styles.privacyNotice}>
                    <AlertCircle size={20} />
                    <p className={styles.privacyNoticeText}>
                      Dengan mengirim laporan, Anda menyetujui bahwa informasi yang diberikan adalah benar. Laporan
                      palsu dapat dikenakan sanksi.
                    </p>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      className={`${componentStyles.button} ${componentStyles.buttonSecondary}`}
                      onClick={() => setCurrentStep(2)}
                    >
                      Kembali
                    </button>
                    <button
                      className={`${componentStyles.button} ${componentStyles.buttonPrimary}`}
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={styles.successPage}
                >
                  <div className={styles.successIcon}>
                    <CheckCircle size={40} />
                  </div>
                  <h2 className={styles.successTitle}>Laporan Terkirim!</h2>
                  <p className={styles.successDescription}>
                    Terima kasih telah menyuarakan aspirasimu. Tim kami akan menindaklanjuti laporan ini.
                  </p>

                  <div className={styles.accessKeyCard}>
                    <p className={styles.accessKeyLabel}>Kode Akses Laporan</p>
                    <div className={styles.accessKeyValue}>
                      <span className={styles.accessKeyCode}>{accessKey}</span>
                      <button className={styles.copyButton} onClick={copyToClipboard} aria-label="Salin kode akses">
                        <Copy size={20} />
                      </button>
                    </div>
                    {copied && (
                      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-success)", marginTop: "8px" }}>
                        Tersalin!
                      </p>
                    )}
                    <div className={styles.accessKeyWarning}>
                      <AlertTriangle size={20} />
                      <p className={styles.accessKeyWarningText}>
                        <strong>Simpan kode ini dengan aman!</strong> Kode ini adalah satu-satunya cara untuk mengakses
                        dan memantau status laporan Anda. Kami tidak dapat memulihkan kode yang hilang.
                      </p>
                    </div>
                  </div>

                  <div className={styles.successActions}>
                    <Link
                      href="/cek-status"
                      className={`${componentStyles.button} ${componentStyles.buttonPrimary}`}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Cek Status Laporan
                    </Link>
                    <Link
                      href="/"
                      className={`${componentStyles.button} ${componentStyles.buttonSecondary}`}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Kembali ke Beranda
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
