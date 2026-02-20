// Get client IP address (supports both client-side and server-side)
export async function getClientIP(): Promise<string> {
  // Server-side: use headers from next/headers (dynamic import to avoid client-side build error)
  if (typeof window === 'undefined') {
    try {
      // Dynamic import to prevent client-side build errors
      const { headers } = await import('next/headers')
      const headersList = await headers()
      
      // Try x-forwarded-for header (Vercel and most proxies)
      const forwardedFor = headersList.get('x-forwarded-for')
      if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
      }
      
      // Try x-real-ip header
      const realIP = headersList.get('x-real-ip')
      if (realIP) {
        return realIP.trim()
      }
      
      // Try cf-connecting-ip header (Cloudflare)
      const cfConnectingIP = headersList.get('cf-connecting-ip')
      if (cfConnectingIP) {
        return cfConnectingIP.trim()
      }
      
      // Fallback to unknown if no IP found in headers
      return 'unknown'
    } catch (error) {
      console.warn('Failed to get IP from headers:', error)
      return 'unknown'
    }
  }

  // Client-side: use existing logic
  // Try to get IP from various headers
  const forwardedMeta = window.document.head.querySelector('meta[name="x-forwarded-for"]')?.getAttribute('content')
  if (forwardedMeta) {
    return forwardedMeta.split(',')[0].trim()
  }

  // Try navigator.connection.remoteAddress
  const connection = (navigator as any).connection
  if (connection?.remoteAddress) {
    return connection.remoteAddress
  }

  // Fallback: use a hash of the user agent and screen dimensions
  // This provides device-level tracking without storing actual IP
  const userAgent = navigator.userAgent
  const screenRes = `${window.screen.width}x${window.screen.height}`
  const language = navigator.language

  const fingerprint = `${userAgent}|${screenRes}|${language}`
  return simpleHash(fingerprint).substring(0, 32)
}

// Get server IP address from request headers (server-side only)
export function getServerIP(request: any): string {
  if (typeof window !== 'undefined') {
    throw new Error('getServerIP() should not be called on client-side')
  }

  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  // Fallback to remote address if available
  const remoteAddr = request.socket?.remoteAddress || request.connection?.remoteAddress
  if (remoteAddr) {
    return remoteAddr.replace(/^::ffff:/, '') // Remove IPv4-mapped IPv6 prefix
  }

  // Last resort: use a generic identifier
  return 'unknown'
}

// Simple synchronous hash function for client-side fingerprinting
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Return a 32-character hex string
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
  return (hashStr + hashStr).substring(0, 32)
}

// Hash IP for storage (one-way hash for privacy)
export async function hashIP(ip: string): Promise<string> {
  const salt = process.env.NEXT_PUBLIC_SUPABASE_URL || 'default'
  const data = ip + salt

  try {
    if (typeof window !== 'undefined') {
      // Client-side: try Web Crypto API first
      if (crypto && crypto.subtle && crypto.subtle.digest) {
        const encoder = new TextEncoder()
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      }
      // Fallback to simple hash if Web Crypto not available
      return simpleHash(data)
    }

    // Server-side: use Node.js crypto
    const { createHash } = await import('crypto')
    return createHash('sha256').update(data).digest('hex')
  } catch (error) {
    console.warn('Hash function failed, using fallback:', error)
    // Ultimate fallback: use simple hash
    return simpleHash(data)
  }
}

// Check rate limit - returns { allowed: boolean, remaining: number, resetAt: number }
export async function checkRateLimit(
  supabase: any,
  hashedIP: string,
  endpoint: string,
  maxRequests: number = 5,
  windowMinutes: number = 10
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const windowMs = windowMinutes * 60 * 1000
  const resetAt = Date.now() + windowMs

  try {
    // Try to get existing rate limit record
    const { data: existing, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('ip_hash', hashedIP)
      .eq('endpoint', endpoint)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Table might not exist yet, allow the request
      console.warn('Rate limit check failed:', error)
      return { allowed: true, remaining: maxRequests, resetAt }
    }

    if (!existing) {
      // First request from this IP for this endpoint
      return { allowed: true, remaining: maxRequests - 1, resetAt }
    }

    const lastRequest = new Date(existing.last_request).getTime()
    const timeSinceLastRequest = Date.now() - lastRequest

    if (timeSinceLastRequest >= windowMs) {
      // Window has reset, allow the request
      await supabase
        .from('rate_limits')
        .upsert({
          ip_hash: hashedIP,
          endpoint,
          last_request: new Date().toISOString(),
          request_count: 1
        }, {
          onConflict: 'ip_hash,endpoint'
        })
      return { allowed: true, remaining: maxRequests - 1, resetAt }
    }

    // Within rate limit window
    if (existing.request_count >= maxRequests) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt: lastRequest + windowMs 
      }
    }

    // Increment counter
    await supabase
      .from('rate_limits')
      .upsert({
        ip_hash: hashedIP,
        endpoint,
        last_request: new Date().toISOString(),
        request_count: existing.request_count + 1
      }, {
        onConflict: 'ip_hash,endpoint'
      })

    return { 
      allowed: true, 
      remaining: maxRequests - existing.request_count - 1, 
      resetAt 
    }
  } catch (error) {
    console.warn('Rate limit check error:', error)
    // On error, allow the request (fail open)
    return { allowed: true, remaining: maxRequests, resetAt }
  }
}

// Client-side rate limit check (before API call)
export function getLocalRateLimit(endpoint: string): { allowed: boolean; waitSeconds: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, waitSeconds: 0 }
  }

  const key = `rate_limit_${endpoint}`
  const countKey = `rate_count_${endpoint}`
  const lastRequest = localStorage.getItem(key)
  const now = Date.now()
  const windowMs = 10 * 60 * 1000 // 10 minutes
  const minInterval = 2 * 60 * 1000 // 2 minutes minimum between requests
  const maxCount = 5

  if (lastRequest) {
    const lastTime = parseInt(lastRequest)
    const timeSinceLast = now - lastTime

    if (timeSinceLast < minInterval) {
      return {
        allowed: false,
        waitSeconds: Math.ceil((minInterval - timeSinceLast) / 1000)
      }
    }

    if (timeSinceLast < windowMs) {
      // Check if within overall window
      const count = parseInt(localStorage.getItem(countKey) || '0')
      if (count >= maxCount) {
        return {
          allowed: false,
          waitSeconds: Math.ceil((windowMs - timeSinceLast) / 1000)
        }
      }
      localStorage.setItem(countKey, (count + 1).toString())
    } else {
      // Reset window
      localStorage.setItem(countKey, '1')
    }
  } else {
    localStorage.setItem(key, now.toString())
    localStorage.setItem(countKey, '1')
  }

  localStorage.setItem(key, now.toString())
  return { allowed: true, waitSeconds: 0 }
}
