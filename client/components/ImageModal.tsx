"use client"

import { useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ZoomIn } from "lucide-react"
import styles from "./ImageModal.module.css"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  fileName?: string
}

export default function ImageModal({ isOpen, onClose, imageUrl, fileName }: ImageModalProps) {
  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, handleEscape])

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={styles.modalContent}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <ZoomIn size={20} />
                <span>Preview Gambar</span>
              </div>
              <button
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Tutup preview"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Container */}
            <div className={styles.imageContainer}>
              <img
                src={imageUrl}
                alt={fileName || "Preview"}
                className={styles.modalImage}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const placeholder = target.nextElementSibling as HTMLElement
                  if (placeholder) placeholder.style.display = "flex"
                }}
              />
              {/* Placeholder for error */}
              <div className={styles.errorPlaceholder} style={{ display: "none" }}>
                <div className={styles.errorIcon}>🖼️</div>
                <p className={styles.errorText}>Bukti tidak tersedia</p>
              </div>
            </div>

            {/* Footer */}
            {fileName && (
              <div className={styles.modalFooter}>
                <p className={styles.fileName}>{fileName}</p>
              </div>
            )}

            {/* Close Button (Bottom) */}
            <div className={styles.modalActions}>
              <button
                onClick={onClose}
                className={styles.closeActionButton}
              >
                Tutup Preview
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
