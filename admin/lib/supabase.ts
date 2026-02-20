import { createClient } from '@supabase/supabase-js'

// Environment variables dengan fallback empty string
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for admin operations)
export const createServerClient = () => {
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.\n' +
      'Please create a .env.local file with the required Supabase credentials.\n' +
      'See .env.local.example for reference.'
    )
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && serviceRoleKey)
}

// Get missing environment variables
export const getMissingEnvVars = (): string[] => {
  const missing: string[] = []
  
  if (!supabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseAnonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  if (!serviceRoleKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY')
  }
  
  return missing
}

