import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createHash } from "crypto";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: "Email diperlukan" },
        { status: 400 }
      );
    }

    const ip = getClientIP(request);
    const ipHash = hashIP(ip);
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from("login_attempts")
      .select("locked_until, attempts")
      .eq("ip_hash", ipHash)
      .eq("email", email.toLowerCase())
      .single();
    
    if (error && error.code !== "PGRST116") {
      console.error("Error checking lockout status:", error);
    }

    if (data?.locked_until) {
      const now = new Date();
      const lockedUntil = new Date(data.locked_until);
      
      if (now < lockedUntil) {
        const remainingTime = lockedUntil.getTime() - now.getTime();
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        
        return NextResponse.json({
          locked: true,
          remainingSeconds: remainingSeconds,
          attempts: data.attempts
        });
      }
    }

    return NextResponse.json({
      locked: false,
      remainingSeconds: 0,
      attempts: data?.attempts || 0
    });

  } catch (error) {
    console.error("Lockout status check error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

