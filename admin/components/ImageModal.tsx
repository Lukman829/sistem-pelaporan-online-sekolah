"use client"

import { useEffect, useCallback } from "react"
import { X, ZoomIn } from "lucide-react"

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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-5"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl overflow-hidden max-w-[90vw] max-h-[90vh] w-full flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <div className="flex items-center gap-2.5 font-semibold">
            <ZoomIn size={20} />
            <span>Preview Gambar</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-105"
            aria-label="Tutup preview"
          >
            <X size={24} />
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center bg-slate-100 p-5 overflow-auto min-h-[300px] max-h-[60vh]">
          <img
            src={imageUrl}
            alt={fileName || "Preview"}
            className="max-w-full max-h-full object-contain rounded-lg shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              const placeholder = target.nextElementSibling as HTMLElement
              if (placeholder) placeholder.style.display = "flex"
            }}
          />
          {/* Placeholder for error */}
          <div className="hidden flex-col items-center justify-center p-10 text-center bg-slate-200 rounded-xl w-full h-full">
            <div className="text-5xl mb-3 opacity-50">🖼️</div>
            <p className="text-slate-500 italic text-base">Bukti tidak tersedia</p>
          </div>
        </div>

        {/* Footer */}
        {fileName && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center break-all m-0">{fileName}</p>
          </div>
        )}

        {/* Close Button (Bottom) */}
        <div className="px-5 py-4 bg-white border-t border-slate-200 flex justify-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-none px-8 py-3 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/30"
          >
            Tutup Preview
          </button>
        </div>
      </div>
    </div>
  )
}
