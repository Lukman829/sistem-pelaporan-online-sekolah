import { NextRequest, NextResponse } from "next/server";
import { adminLogin } from "@/lib/admin-auth";
import { createServerClient } from "@/lib/supabase";
import { createHash } from "crypto";

// ============================================
// RATE LIMITING CONFIG
// ============================================

const BASE_LOCKOUT_MINUTES = 5; // 5 menit untuk 2x salah
const ADDITIONAL_MINUTES_PER_ATTEMPT = 1; // +1 menit setiap salah tambahan
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 2;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  
  return "127.0.0.1";
}

function hashIP(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

function calculateLockoutMinutes(attempts: number): number {
  if (attempts <= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    return BASE_LOCKOUT_MINUTES;
  }
  return BASE_LOCKOUT_MINUTES + (attempts - MAX_ATTEMPTS_BEFORE_LOCKOUT) * ADDITIONAL_MINUTES_PER_ATTEMPT;
}

function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function getLoginAttempt(ipHash: string, email: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("login_attempts")
    .select("*")
    .eq("ip_hash", ipHash)
    .eq("email", email.toLowerCase())
    .single();
  
  if (error && error.code !== "PGRST116") { // PGRST116 = not found
    console.error("Error fetching login attempt:", error);
  }
  
  return data;
}

async function upsertLoginAttempt(
  ipHash: string, 
  email: string, 
  attempts: number, 
  lockedUntil: Date | null
) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from("login_attempts")
    .upsert({
      ip_hash: ipHash,
      email: email.toLowerCase(),
      attempts: attempts,
      locked_until: lockedUntil?.toISOString() || null,
      last_attempt: new Date().toISOString()
    }, {
      onConflict: "ip_hash,email"
    });
  
  if (error) {
    console.error("Error upserting login attempt:", error);
  }
}

async function deleteLoginAttempt(ipHash: string, email: string) {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from("login_attempts")
    .delete()
    .eq("ip_hash", ipHash)
    .eq("email", email.toLowerCase());
  
  if (error) {
    console.error("Error deleting login attempt:", error);
  }
}

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const ip = getClientIP(request);
    const ipHash = hashIP(ip);
    const now = new Date();

    // Check apakah sedang dalam lockout dari database
    const existingAttempt = await getLoginAttempt(ipHash, email);
    
    if (existingAttempt?.locked_until) {
      const lockedUntil = new Date(existingAttempt.locked_until);
      
      if (now < lockedUntil) {
        const remainingTime = lockedUntil.getTime() - now.getTime();
        const formattedTime = formatRemainingTime(remainingTime);
        
        return NextResponse.json(
          { 
            error: `Terlalu banyak percobaan gagal. Silakan tunggu ${formattedTime}.`,
            lockout: true,
            remainingSeconds: Math.ceil(remainingTime / 1000)
          },
          { status: 429 }
        );
      }
    }

    // Proses login
    const result = await adminLogin(email, password);

    if (!result.success) {
      // Login gagal - update database
      const currentAttempts = existingAttempt?.attempts || 0;
      const newAttempts = currentAttempts + 1;
      
      let lockedUntil: Date | null = null;
      
      // Check if should lockout
      if (newAttempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
        const lockoutMinutes = calculateLockoutMinutes(newAttempts);
        lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);
        
        await upsertLoginAttempt(ipHash, email, newAttempts, lockedUntil);
        
        const formattedTime = formatRemainingTime(lockoutMinutes * 60 * 1000);
        
        return NextResponse.json(
          { 
            error: `Terlalu banyak percobaan gagal. Silakan tunggu ${formattedTime}.`,
            lockout: true,
            remainingSeconds: lockoutMinutes * 60
          },
          { status: 429 }
        );
      }

      // Belum lockout, simpan attempt
      await upsertLoginAttempt(ipHash, email, newAttempts, null);
      
      return NextResponse.json(
        { error: result.error || "Email atau password salah" },
        { status: 401 }
      );
    }

    // Login berhasil - hapus login attempt dari database
    await deleteLoginAttempt(ipHash, email);

    // Set session cookie (session cookie - expire on browser close)
    const response = NextResponse.json(
      { success: true, message: "Login berhasil" },
      { status: 200 }
    );

    response.cookies.set("admin_token", result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

