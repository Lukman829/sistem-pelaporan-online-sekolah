import { supabase, createServerClient } from '@/lib/supabase'
import { getClientIP, checkRateLimit, hashIP } from '@/lib/rate-limit'
import type { TimelineItem } from '../components/Timeline'

// Types
export interface ReportData {
  category: 'bullying' | 'idea'
  title: string
  description: string
  location?: string
  files?: File[]
  accessKey: string
}

export interface ReportStatus {
  id: string
  accessKey: string
  title: string
  category: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
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

// Rate limit configuration
const RATE_LIMIT_WINDOW = 10 // minutes
const RATE_LIMIT_MAX = 5 // max requests per window

/**
 * Check if user can submit a report (rate limiting)
 */
export async function canSubmitReport(): Promise<{ allowed: boolean; waitSeconds?: number }> {
  const ip = await getClientIP()
  const hashedIP = await hashIP(ip)
  
  const { allowed, remaining, resetAt } = await checkRateLimit(
    supabase,
    hashedIP,
    'submit_report',
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW
  )
  
  if (!allowed) {
    const waitSeconds = Math.ceil((resetAt - Date.now()) / 1000)
    return { allowed: false, waitSeconds }
  }
  
  return { allowed: true }
}

/**
 * Check if user can search for a report
 */
export async function canSearchReport(): Promise<{ allowed: boolean; waitSeconds?: number }> {
  const ip = await getClientIP()
  const hashedIP = await hashIP(ip)
  
  const { allowed, remaining, resetAt } = await checkRateLimit(
    supabase,
    hashedIP,
    'search_report',
    RATE_LIMIT_MAX * 2, // More lenient for searches
    RATE_LIMIT_WINDOW
  )
  
  if (!allowed) {
    const waitSeconds = Math.ceil((resetAt - Date.now()) / 1000)
    return { allowed: false, waitSeconds }
  }
  
  return { allowed: true }
}

/**
 * Submit a new report to Supabase via API
 * 
 * @param data - Report data to submit
 * @returns - Object with success status, access key, and message
 */
export async function submitReports(data: ReportData): Promise<{ 
  success: boolean; 
  accessKey: string; 
  message?: string;
  error?: string;
}> {
  // Check rate limit
  const rateLimit = await canSubmitReport()
  if (!rateLimit.allowed) {
    return {
      success: false,
      accessKey: '',
      message: undefined,
      error: `Terlalu banyak permintaan. Silakan tunggu ${rateLimit.waitSeconds} detik sebelum mengirim laporan lagi.`
    }
  }

  try {
    // Upload files first if present
    const fileData: { name: string; type: string; size: number; data: string }[] = []
    
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        fileData.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64
        })
      }
    }

    // Submit via API route
    const response = await fetch('/api/reports/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: data.category,
        title: data.title,
        description: data.description,
        location: data.location || null,
        accessKey: data.accessKey,
        files: fileData
      })
    })

    const result = await response.json()

    // Handle HTTP errors - capture server's error message
    if (!response.ok) {
      const errorMessage = result.error || `Server error (${response.status}): Gagal mengirim laporan`
      console.error('Error submitting report:', errorMessage)
      return {
        success: false,
        accessKey: '',
        message: undefined,
        error: errorMessage
      }
    }

    return {
      success: true,
      accessKey: result.accessKey,
      message: result.message || 'Laporan berhasil dikirim!',
      error: undefined
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan jaringan'
    console.error('Error submitting report:', error)
    return {
      success: false,
      accessKey: '',
      message: undefined,
      error: `Gagal mengirim laporan: ${errorMessage}. Silakan coba lagi.`
    }
  }
}

/**
 * Get the status of a report by access key
 * 
 * @param accessKey - The 12-character access key
 * @returns - Report status object or null if not found/error
 */
export async function getReportStatus(accessKey: string): Promise<{
  success: boolean;
  data?: ReportStatus | null;
  error?: string;
}> {
  // Check rate limit for search (just log, don't block)
  const rateLimit = await canSearchReport()
  if (!rateLimit.allowed) {
    console.warn('Rate limit exceeded for report search')
    // Don't return error, just log - still allow legitimate searches
  }

  try {
    // Fetch via API route
    const response = await fetch(`/api/reports/status?key=${encodeURIComponent(accessKey)}`)
    const result = await response.json()

    // Handle HTTP errors - capture server's error message
    if (!response.ok) {
      // Return the error message from server
      const errorMessage = result.error || `Gagal mengambil status laporan (${response.status})`
      console.error('Error fetching report:', errorMessage)
      return {
        success: false,
        data: null,
        error: errorMessage
      }
    }

    const data = result.data

    const timeline: TimelineItem[] = (data.timeline || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      note: item.note || '',
      date: item.date,
      isCompleted: item.isCompleted || false,
      isActive: item.isActive || false
    }))

    const reportStatus: ReportStatus = {
      id: data.id,
      accessKey: data.accessKey,
      title: data.title,
      category: data.category,
      status: data.status,
      statusLabel: data.statusLabel || data.status,
      createdAt: data.createdAt,
      description: data.description,
      location: data.location || undefined,
      progress: data.progress,
      timeline,
      evidence: data.evidence || []
    }

    return {
      success: true,
      data: reportStatus,
      error: undefined
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan jaringan'
    console.error('Error getting report status:', error)
    return {
      success: false,
      data: null,
      error: `Gagal mengambil status laporan: ${errorMessage}. Silakan coba lagi.`
    }
  }
}

/**
 * Upload evidence files to Supabase Storage
 */
export async function uploadEvidence(
  accessKey: string,
  files: File[]
): Promise<string[]> {
  const uploadedUrls: string[] = []

  try {
    for (const file of files) {
      const fileName = `${accessKey}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      const { error } = await supabase.storage
        .from('evidence')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Error uploading file:', error)
        continue
      }

      const { data } = supabase.storage
        .from('evidence')
        .getPublicUrl(fileName)

      uploadedUrls.push(data.publicUrl)
    }
  } catch (error) {
    console.error('Error uploading evidence:', error)
  }

  return uploadedUrls
}

/**
 * Generate a unique 12-character access key
 * Format: XXXX-XXXX-XXXX (without dashes for display)
 */
export function generateAccessKey(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluded similar characters (I,O,0,1)
  let result = ""

  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }

  return result
}

/**
 * Validate access key format
 */
export function validateAccessKey(key: string): boolean {
  // Must be exactly 12 characters
  if (key.length !== 12) return false

  // Must only contain allowed characters
  const allowedPattern = /^[A-HJ-NP-Z2-9]+$/
  return allowedPattern.test(key)
}

/**
 * Format access key for display (add dashes)
 */
export function formatAccessKey(key: string): string {
  if (key.length !== 12) return key
  return `${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}`
}

/**
 * Store access key in local storage (optional - for user convenience)
 */
export function storeAccessKey(key: string): void {
  try {
    const stored = getStoredAccessKeys()
    if (!stored.includes(key)) {
      stored.push(key)
      localStorage.setItem("yourvoice_keys", JSON.stringify(stored))
    }
  } catch {
    console.warn("Could not store access key in localStorage")
  }
}

/**
 * Get stored access keys from local storage
 */
export function getStoredAccessKeys(): string[] {
  try {
    const stored = localStorage.getItem("yourvoice_keys")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Remove an access key from local storage
 */
export function removeStoredAccessKey(key: string): void {
  try {
    const stored = getStoredAccessKeys()
    const filtered = stored.filter((k) => k !== key)
    localStorage.setItem("yourvoice_keys", JSON.stringify(filtered))
  } catch {
    console.warn("Could not remove access key from localStorage")
  }
}
