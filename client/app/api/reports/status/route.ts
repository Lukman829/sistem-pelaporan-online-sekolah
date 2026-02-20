import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { hashIP, getServerIP, getClientIP } from '@/lib/rate-limit'

// ============================================
// RATE LIMITING CONFIGURATION (More lenient)
// ============================================

const RATE_LIMIT_WINDOW = 10 // minutes
const RATE_LIMIT_MAX = 10

// ============================================
// VALIDATION HELPERS
// ============================================

function validateAccessKey(key: string): { valid: boolean; normalized?: string; error?: string } {
  if (!key) return { valid: false, error: 'Kode akses diperlukan' }
  
  const normalized = key.toUpperCase().replace(/-/g, '')
  
  if (normalized.length !== 12) {
    return { valid: false, error: 'Kode akses harus 12 karakter' }
  }
  
  // Only allow certain characters
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const invalidChars = normalized.split('').filter(c => !allowedChars.includes(c))
  
  if (invalidChars.length > 0) {
    return { valid: false, error: 'Kode akses tidak valid' }
  }
  
  return { valid: true, normalized }
}

// ============================================
// API ROUTE: Check Report Status (Client)
// Method: GET
// Endpoint: /api/reports/status?key=XXXX
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Supabase service role key not configured' },
        { status: 500 }
      )
    }

    const supabase = createServerClient()
    const clientIP = await getClientIP()
    const hashedIP = await hashIP(clientIP)
    const windowMs = RATE_LIMIT_WINDOW * 60 * 1000
    const searchParams = request.nextUrl.searchParams
    const accessKey = searchParams.get('key')

    // ========================================
    // 1. VALIDATE ACCESS KEY
    // ========================================

    if (!accessKey) {
      return NextResponse.json(
        { success: false, error: 'Kode akses diperlukan' },
        { status: 400 }
      )
    }

    const keyValidation = validateAccessKey(accessKey)
    if (!keyValidation.valid) {
      return NextResponse.json(
        { success: false, error: keyValidation.error },
        { status: 400 }
      )
    }

    const normalizedKey = keyValidation.normalized!

    // ========================================
    // 2. RATE LIMIT CHECK (Log only, don't block)
// ========================================

    const { data: existing, error: rateError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_hash', hashedIP)
      .eq('endpoint', 'api_report_status')
      .single()

    if (!rateError && existing) {
      const lastRequest = new Date(existing.last_request).getTime()
      const timeSinceLast = Date.now() - lastRequest

      if (timeSinceLast < windowMs && existing.request_count >= RATE_LIMIT_MAX) {
        // Log warning but still allow (more user-friendly)
        console.warn(`Rate limit warning for IP: ${clientIP}`)
      }
    }

    // ========================================
    // 3. FETCH REPORT FROM DATABASE
    // ========================================

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('access_key', normalizedKey)
      .single()

    if (reportError) {
      console.error('Report fetch error:', reportError)
      if (reportError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Laporan tidak ditemukan. Pastikan kode akses yang Anda masukkan benar.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: `Gagal mengambil data laporan: ${reportError.message}` },
        { status: 500 }
      )
    }

    // ========================================
    // 4. FETCH TIMELINE
    // ========================================

    const { data: timelineData, error: timelineError } = await supabase
      .from('report_timeline')
      .select('*')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true })

    if (timelineError) {
      console.error('Timeline fetch error:', timelineError)
    }

    // ========================================
    // 5. FETCH EVIDENCE
    // ========================================

    const { data: evidenceData, error: evidenceError } = await supabase
      .from('report_evidence')
      .select('*')
      .eq('report_id', report.id)
      .order('uploaded_at', { ascending: true })

    if (evidenceError) {
      console.error('Evidence fetch error:', evidenceError)
    }

    // ========================================
    // 6. FORMAT RESPONSE
    // ========================================

    const statusLabels: Record<string, string> = {
      pending: 'Laporan Diterima',
      in_progress: 'Sedang Diproses',
      resolved: 'Selesai Ditangani',
      closed: 'Laporan Ditutup'
    }

    const categoryLabels: Record<string, string> = {
      bullying: 'Bullying',
      idea: 'Ide/Saran'
    }

    // Status title mapping for timeline items
    const getStatusTitle = (status: string): string => {
      const titles: Record<string, string> = {
        pending: 'Laporan Diterima',
        in_progress: 'Laporan Sedang Diproses',
        resolved: 'Laporan Selesai',
        closed: 'Laporan Ditutup'
      }
      return titles[status] || 'Status Diperbarui'
    }

    // Template messages based on status change
    const getStatusTemplate = (status: string): string => {
      const templates: Record<string, string> = {
        pending: 'Laporan telah berhasil dibuat dan masuk ke sistem.',
        in_progress: 'Petugas telah menerima laporan dan mulai melakukan penanganan.',
        resolved: 'Penanganan laporan telah selesai dilakukan oleh tim terkait.',
        closed: 'Laporan ini telah ditutup.'
      }
      return templates[status] || ''
    }

    // Helper to extract clean admin note (removes technical terms)
    const getCleanAdminNote = (item: any): string => {
      // Admin notes are stored in the 'title' field from the database
      let adminMessage = item.title || ''
      
      // If title contains status keywords, it's not an admin note
      const statusKeywords = ['pending', 'in_progress', 'resolved', 'closed', 'diterima', 'diproses', 'selesai']
      const isStatusTitle = statusKeywords.some(keyword => 
        adminMessage.toLowerCase().includes(keyword)
      )
      
      // If title looks like a status title, check description for admin note
      if (isStatusTitle && item.description) {
        // Try to extract admin note from description (after removing template)
        adminMessage = item.description
          .replace(/Status diubah dari\s+\w+\s+ke\s+\w+/gi, '')
          .replace(/Laporan telah berhasil dibuat dan masuk ke sistem\./gi, '')
          .replace(/Petugas telah menerima laporan dan mulai melakukan penanganan\./gi, '')
          .replace(/Penanganan laporan telah selesai dilakukan oleh tim terkait\./gi, '')
          .replace(/Laporan ini telah ditutup\./gi, '')
          .trim()
      }
      
      const cleaned = adminMessage
        .replace(/in_progress|pending|resolved|closed/g, '')
        .replace(/Status diubah dari\s+\w+\s+ke\s+\w+/gi, '')
        .replace(/,\s*Progress:\s*\d+%/gi, '') // Remove progress info
        .replace(/\s+/g, ' ')
        .trim()
      
      return cleaned
    }

    // Helper to extract new status from various sources
    const getNewStatus = (item: any): string => {
      // First check explicit metadata
      if (item.new_status) return item.new_status
      if (item.status) return item.status
      
      // Try to extract from description
      if (item.description && item.description.includes('Status diubah dari')) {
        const match = item.description.match(/ke\s+(\w+)/)
        if (match) return match[1]
      }
      
      return 'pending'
    }

    // Format timeline items with separate title and note
    const timeline = (timelineData || []).map((item) => {
      // Extract status from various sources
      let newStatus = item.status || 'pending'
      
      // Parse status from description if available
      if (item.description) {
        const statusMatch = item.description.match(/ke\s+(in_progress|pending|resolved|closed)/)
        if (statusMatch) {
          newStatus = statusMatch[1]
        }
      }
      
      // Get what the title SHOULD be based on status
      const expectedTitle = getStatusTitle(newStatus)
      
      // Get the actual title from database
      const actualTitle = (item.title || '').trim()
      
      // Get template description
      const template = getStatusTemplate(newStatus)
      
      // Determine if the actual title is an admin note
      // An admin note is any title that doesn't match the expected status title
      let title = expectedTitle
      let adminNote = ''
      
      // Check if actual title is different from expected (case-insensitive comparison)
      const isDefaultTitle = actualTitle.toLowerCase() === expectedTitle.toLowerCase() ||
        actualTitle.toLowerCase().includes(newStatus.toLowerCase().replace('_', ' '))
      
      if (actualTitle && !isDefaultTitle) {
        // The actual title is an admin note from the admin
        adminNote = actualTitle
      }
      
      // Also extract admin note from description if present
      // Description format: "Status diubah dari X ke Y. Admin note here."
      if (item.description) {
        // Remove the status change line
        let descClean = item.description
          .replace(/Status diubah dari\s+\w+\s+ke\s+\w+/gi, '')
          .replace(/Laporan telah berhasil dibuat dan masuk ke sistem\./gi, '')
          .replace(/Petugas telah menerima laporan dan mulai melakukan penanganan\./gi, '')
          .replace(/Penanganan laporan telah selesai dilakukan oleh tim terkait\./gi, '')
          .replace(/Laporan ini telah ditutup\./gi, '')
          .trim()
        
        // If there's remaining content after removing templates, it's an admin note
        if (descClean && descClean !== template && descClean.length > 0) {
          // If we already have an admin note from title, append to it
          if (adminNote) {
            adminNote = `${adminNote}. ${descClean}`
          } else {
            adminNote = descClean
          }
        }
      }
      
      // Clean up admin note - remove technical terms and progress info
      if (adminNote) {
        adminNote = adminNote
          .replace(/in_progress|pending|resolved|closed/g, '')
          .replace(/,\s*Progress:\s*\d+%/gi, '')
          .replace(/\s+/g, ' ')
          .trim()
      }
      
      return {
        id: item.id,
        title: title,
        description: template,
        note: adminNote || '',
        date: new Date(item.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        isCompleted: item.is_completed || false,
        isActive: item.is_active || false
      }
    })

    // Build evidence URLs with proper format
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const evidence = (evidenceData || []).map((item) => {
      // Construct public URL manually to ensure correct format
      const filePath = item.file_path
      const publicUrl = filePath 
        ? `${supabaseUrl}/storage/v1/object/public/evidence/${filePath}`
        : ''
      
      return {
        id: item.id,
        fileName: item.file_name,
        filePath: item.file_path,
        fileSize: item.file_size,
        mimeType: item.mime_type,
        uploadedAt: new Date(item.uploaded_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        url: publicUrl
      }
    })

    const responseData = {
      id: report.id,
      accessKey: report.access_key,
      title: report.title,
      category: report.category,
      categoryLabel: categoryLabels[report.category] || report.category,
      status: report.status,
      statusLabel: statusLabels[report.status] || report.status,
      createdAt: new Date(report.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      description: report.description,
      location: report.location || null,
      progress: report.progress,
      timeline,
      evidence
    }

    // ========================================
    // 7. UPDATE RATE LIMIT
    // ========================================

    await supabase
      .from('rate_limits')
      .upsert({
        ip_hash: hashedIP,
        endpoint: 'api_report_status',
        last_request: new Date().toISOString(),
        request_count: existing ? existing.request_count + 1 : 1
      }, {
        onConflict: 'ip_hash,endpoint'
      })

    // ========================================
    // 8. SUCCESS RESPONSE
    // ========================================

    return NextResponse.json({
      success: true,
      data: responseData
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60'
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
