/**
 * Admin Authentication Utilities
 * Sistem login single admin dengan email + password dari environment variables
 * 
 * PENTING: Semua kredensial harus diatur di .env.local
 * Jangan pernah hardcode username/password di kode!
 */

import { cookies } from 'next/headers'

// ============================================
// KONFIGURASI ADMIN DARI ENVIRONMENT VARIABLES
// ============================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// ============================================
// VALIDASI KONFIGURASI SAAT INIT
// ============================================

let isConfigured = false
let configError: string | null = null

if (!ADMIN_EMAIL) {
  configError = 'ADMIN_EMAIL tidak ditemukan di environment variables'
} else if (!ADMIN_PASSWORD) {
  configError = 'ADMIN_PASSWORD tidak ditemukan di environment variables'
} else {
  // Validasi format email dasar
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(ADMIN_EMAIL)) {
    configError = 'Format ADMIN_EMAIL tidak valid'
  } else if (ADMIN_PASSWORD.length < 8) {
    configError = 'ADMIN_PASSWORD minimal 8 karakter untuk keamanan'
  } else {
    isConfigured = true
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if admin system is properly configured
 */
export function isAdminConfigured(): { configured: boolean; error?: string } {
  if (isConfigured) {
    return { configured: true }
  }
  return { configured: false, error: configError || 'Konfigurasi tidak lengkap' }
}

/**
 * Get admin email (tanpa password)
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL || ''
}

// ============================================
// PASSWORD VERIFICATION (SERVER-SIDE ONLY)
// ============================================

/**
 * Verifikasi password - dilakukan di server side untuk keamanan
 * Password comparison menggunakan timing-safe comparison
 */
async function verifyPassword(
  plainPassword: string,
  storedPassword: string
): Promise<boolean> {
  // Timing-safe comparison untuk prevent timing attacks
  const encoder = new TextEncoder()
  const plainBuffer = encoder.encode(plainPassword)
  const storedBuffer = encoder.encode(storedPassword)
  
  if (plainBuffer.length !== storedBuffer.length) {
    return false
  }
  
  // Constant-time comparison
  let result = 0
  for (let i = 0; i < plainBuffer.length; i++) {
    result |= plainBuffer[i] ^ storedBuffer[i]
  }
  
  return result === 0
}

// ============================================
// ADMIN LOGIN
// ============================================

/**
 * Proses login admin - semua validasi di server side
 * 
 * @param email - Email admin dari input user
 * @param password - Password admin dari input user
 * @returns - Token jika berhasil, error jika gagal
 */
export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // 1. Check konfigurasi sistem
  const configCheck = isAdminConfigured()
  if (!configCheck.configured) {
    console.error('Admin system not configured:', configCheck.error)
    return { 
      success: false, 
      error: 'Sistem login tidak dikonfigurasi dengan benar. Hubungi administrator.' 
    }
  }

  // 2. Validasi format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: 'Format email tidak valid' }
  }

  // 3. Validasi password tidak kosong
  if (!password || password.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter' }
  }

  // 4. Verifikasi email (case insensitive)
  if (email.toLowerCase() !== ADMIN_EMAIL!.toLowerCase()) {
    // Log attempt yang gagal untuk security monitoring
    console.warn(`Failed login attempt - invalid email: ${email} at ${new Date().toISOString()}`)
    return { success: false, error: 'Email atau password salah' }
  }

  // 5. Verifikasi password (timing-safe)
  const isPasswordValid = await verifyPassword(password, ADMIN_PASSWORD!)
  
  if (!isPasswordValid) {
    // Log attempt yang gagal
    console.warn(`Failed login attempt - invalid password for: ${email} at ${new Date().toISOString()}`)
    return { success: false, error: 'Email atau password salah' }
  }

  // 6. Generate session token yang aman
  const token = generateSessionToken()

  // 7. Log successful login
  console.log(`Admin login successful: ${email} at ${new Date().toISOString()}`)

  return {
    success: true,
    token
  }
}

// ============================================
// SESSION TOKEN MANAGEMENT
// ============================================

/**
 * Generate session token yang aman menggunakan crypto
 * Format: base64(timestamp:randomHex)
 * Berlaku 24 jam
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString()
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Gabungkan dan encode base64
  const tokenData = `${timestamp}:${randomHex}`
  return Buffer.from(tokenData).toString('base64')
}

/**
 * Verifikasi session token
 * 
 * @param token - Token yang dikirim client
 * @returns - true jika token valid dan belum expired
 */
export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [timestamp, randomHex] = decoded.split(':')

    // Validasi format
    if (!timestamp || !randomHex || randomHex.length !== 64) {
      return false
    }

    // Validasi timestamp adalah angka
    const timestampNum = parseInt(timestamp, 10)
    if (isNaN(timestampNum)) {
      return false
    }

    // Hitung umur token (dalam milidetik)
    const tokenAge = Date.now() - timestampNum
    const maxAge = 24 * 60 * 60 * 1000 // 24 jam

    // Token valid jika belum expired
    return tokenAge < maxAge
  } catch {
    return false
  }
}

/**
 * Get token expiration time
 * 
 * @param token - Session token
 * @returns - Tanggal expired dalam format readable
 */
export function getTokenExpiration(token: string): string {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [timestamp] = decoded.split(':')
    const expiryDate = new Date(parseInt(timestamp) + 24 * 60 * 60 * 1000)
    
    return expiryDate.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Tidak diketahui'
  }
}

/**
 * Check if user is authenticated (for server components)
 */
export async function checkAuth(): Promise<{ authenticated: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return { authenticated: false, error: 'Token tidak ditemukan' }
    }

    if (!verifySessionToken(token)) {
      return { authenticated: false, error: 'Sesi telah berakhir, silakan login kembali' }
    }

    return { authenticated: true }
  } catch (error) {
    console.error('Auth check error:', error)
    return { authenticated: false, error: 'Gagal memverifikasi sesi' }
  }
}

// ============================================
// PASSWORD UTILITIES (Untuk generate password aman)
// ============================================

/**
 * Generate password yang aman
 * Format yang direkomendasikan: Kata + Angka + Simbol
 */
export function generateSecurePassword(): string {
  const words = ['Sekolah', 'SMK', 'OSIS', 'Bangkit', 'Maju', 'Juara', 'Cerdas', 'Berprestasi']
  const word = words[Math.floor(Math.random() * words.length)]
  const year = new Date().getFullYear()
  const symbols = ['!', '#', '$', '@', '%', '&', '*']
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const extraNum = Math.floor(Math.random() * 100)
  
  return `${word}${year}${symbol}${extraNum}` // Contoh: SMK2024!42
}

/**
 * Contoh penggunaan:
 * - generateSecurePassword() → "OSIS2024@37"
 */

