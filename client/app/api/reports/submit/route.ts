import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { hashIP, getServerIP } from '@/lib/rate-limit'

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

const RATE_LIMIT_WINDOW = 10 // minutes
const RATE_LIMIT_MAX = 5

// ============================================
// VALIDATION HELPERS
// ============================================

function validateAccessKey(key: string): { valid: boolean; normalized?: string; error?: string } {
  if (!key) return { valid: false, error: 'Kode akses diperlukan' }
  
  const normalized = key.toUpperCase().replace(/-/g, '')
  
  if (normalized.length !== 12) {
    return { valid: false, error: 'Kode akses harus 12 karakter' }
  }
  
  // Only allow certain characters (exclude confusing ones: I, O, 0, 1)
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const invalidChars = normalized.split('').filter(c => !allowedChars.includes(c))
  
  if (invalidChars.length > 0) {
    return { valid: false, error: 'Kode akses tidak valid' }
  }
  
  return { valid: true, normalized }
}

function validateTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Judul diperlukan' }
  }
  
  const trimmed = title.trim()
  
  if (trimmed.length < 5) {
    return { valid: false, error: 'Judul minimal 5 karakter' }
  }
  
  if (trimmed.length > 255) {
    return { valid: false, error: 'Judul maksimal 255 karakter' }
  }
  
  return { valid: true }
}

function validateDescription(description: string): { valid: boolean; error?: string } {
  if (!description || description.trim().length === 0) {
    return { valid: false, error: 'Deskripsi diperlukan' }
  }
  
  const trimmed = description.trim()
  
  if (trimmed.length < 10) {
    return { valid: false, error: 'Deskripsi minimal 10 karakter' }
  }
  
  if (trimmed.length > 5000) {
    return { valid: false, error: 'Deskripsi maksimal 5000 karakter' }
  }
  
  return { valid: true }
}

function validateCategory(category: string): { valid: boolean; error?: string } {
  const validCategories = ['bullying', 'idea']
  
  if (!validCategories.includes(category)) {
    return { valid: false, error: 'Kategori tidak valid' }
  }
  
  return { valid: true }
}

function validateLocation(location?: string): { valid: boolean; normalized?: string; error?: string } {
  if (!location || location.trim().length === 0) {
    return { valid: true }
  }
  
  const trimmed = location.trim()
  
  if (trimmed.length > 255) {
    return { valid: false, error: 'Lokasi maksimal 255 karakter' }
  }
  
  return { valid: true, normalized: trimmed }
}

function validateFiles(files?: any[]): { valid: boolean; error?: string } {
  if (!files || files.length === 0) {
    return { valid: true }
  }
  
  const maxFileSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  
  for (const file of files) {
    if (file.size > maxFileSize) {
      return { valid: false, error: `File ${file.name} terlalu besar (max 10MB)` }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File ${file.name} tidak didukung` }
    }
  }
  
  return { valid: true }
}

// ============================================
// API ROUTE: Submit Report (Client)
// Method: POST
// Endpoint: /api/reports/submit
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Supabase service role key not configured' },
        { status: 500 }
      )
    }

    const supabase = createServerClient()
    const clientIP = getServerIP(request)
    const hashedIP = await hashIP(clientIP)
    const windowMs = RATE_LIMIT_WINDOW * 60 * 1000

    // ========================================
    // 1. RATE LIMIT CHECK
    // ========================================

    const { data: existing, error: rateError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_hash', hashedIP)
      .eq('endpoint', 'api_report_submit')
      .single()

    if (!rateError && existing) {
      const lastRequest = new Date(existing.last_request).getTime()
      const timeSinceLast = Date.now() - lastRequest

      if (timeSinceLast < windowMs && existing.request_count >= RATE_LIMIT_MAX) {
        const waitSeconds = Math.ceil((windowMs - timeSinceLast) / 1000)
        return NextResponse.json(
          { success: false, error: `Terlalu banyak permintaan. Tunggu ${waitSeconds} detik.` },
          { status: 429 }
        )
      }
    }

    // ========================================
    // 2. PARSE REQUEST BODY
    // ========================================

    const body = await request.json()
    const { category, title, description, location, accessKey, files } = body

    // ========================================
    // 3. VALIDATE ALL INPUTS
    // ========================================

    const validations = [
      validateAccessKey(accessKey),
      validateCategory(category),
      validateTitle(title),
      validateDescription(description),
      validateLocation(location),
      validateFiles(files)
    ]

    for (const validation of validations) {
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        )
      }
    }

    // ========================================
    // 4. INSERT REPORT TO DATABASE
    // ========================================

    const normalizedKey = accessKey.toUpperCase().replace(/-/g, '')
    
    console.log('Attempting to insert report with:', {
      access_key: normalizedKey,
      category,
      title: title.trim(),
      descriptionLength: description.trim().length,
      location: location?.trim() || null,
      status: 'pending',
      progress: 0
    })
    
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        access_key: normalizedKey,
        category,
        title: title.trim(),
        description: description.trim(),
        location: location?.trim() || null,
        status: 'pending',
        progress: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      
      // Check for common issues
      if (insertError.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'Table "reports" tidak ditemukan. Jalankan SQL setup di Supabase Dashboard → SQL Editor.' },
          { status: 500 }
        )
      }
      
      if (insertError.code === '42703') {
        return NextResponse.json(
          { success: false, error: `Kolom tidak valid. ${insertError.message}` },
          { status: 500 }
        )
      }
      
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Kode akses sudah digunakan' },
          { status: 409 }
        )
      }
      
      if (insertError.code === '22P02') {
        return NextResponse.json(
          { success: false, error: 'Format data tidak valid. Pastikan category adalah "bullying" atau "idea".' },
          { status: 400 }
        )
      }
      
      // RLS or permission issue
      if (insertError.code === 'PGRST301' || insertError.message?.includes('row-level security')) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Pastikan service role key memiliki akses ke tabel.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: `Gagal menyimpan laporan: [${insertError.code}] ${insertError.message}` },
        { status: 500 }
      )
    }

    // ========================================
    // 5. UPDATE RATE LIMIT
    // ========================================

    await supabase
      .from('rate_limits')
      .upsert({
        ip_hash: hashedIP,
        endpoint: 'api_report_submit',
        last_request: new Date().toISOString(),
        request_count: existing ? existing.request_count + 1 : 1
      }, {
        onConflict: 'ip_hash,endpoint'
      })

    // ========================================
    // 6. UPLOAD FILES (IF ANY)
    // ========================================

    const uploadedFiles: string[] = []

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileName = `${normalizedKey}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('evidence')
            .upload(fileName, Buffer.from(file.data, 'base64'), {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false
            })

          if (!uploadError) {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('evidence')
              .getPublicUrl(fileName)

            // Save to evidence table
            const { error: evidenceError } = await supabase
              .from('report_evidence')
              .insert({
                report_id: report.id,
                file_name: file.name,
                file_path: fileName,
                file_size: file.size,
                mime_type: file.type
              })

            if (!evidenceError) {
              uploadedFiles.push(urlData.publicUrl)
            }
          }
        } catch (error) {
          console.error('File upload error:', error)
        }
      }
    }

    // ========================================
    // 7. SUCCESS RESPONSE
    // ========================================

    return NextResponse.json({
      success: true,
      accessKey: normalizedKey,
      message: 'Laporan berhasil dikirim!',
      data: {
        id: report.id,
        category: report.category,
        title: report.title,
        status: report.status,
        createdAt: report.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

