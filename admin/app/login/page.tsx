"use client";

export const dynamic = 'force dynamic';

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Lock, Shield, Timer } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLockout, setCheckingLockout] = useState(false);
  
  // Rate limiting states
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // Format remaining time
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Check lockout status from server
  const checkLockoutStatus = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) return;
    
    setCheckingLockout(true);
    try {
      const response = await fetch(`/api/admin/login/status?email=${encodeURIComponent(emailToCheck)}`);
      const data = await response.json();
      
      if (data.locked && data.remainingSeconds > 0) {
        setIsLockedOut(true);
        setRemainingSeconds(data.remainingSeconds);
        setError(`Terlalu banyak percobaan gagal. Silakan tunggu ${formatTime(data.remainingSeconds)}.`);
      } else {
        setIsLockedOut(false);
        setRemainingSeconds(0);
        if (isLockedOut) {
          setError("");
        }
      }
    } catch (err) {
      console.error("Error checking lockout status:", err);
    } finally {
      setCheckingLockout(false);
    }
  }, [formatTime, isLockedOut]);

  // Check lockout when email changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email) {
        checkLockoutStatus(email);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email, checkLockoutStatus]);

  // Countdown timer effect
  useEffect(() => {
    if (!isLockedOut || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsLockedOut(false);
          setError("");
          // Re-check status from server when timer reaches 0
          checkLockoutStatus(email);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, remainingSeconds, email, checkLockoutStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) return;
    
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.lockout && data.remainingSeconds) {
          setIsLockedOut(true);
          setRemainingSeconds(data.remainingSeconds);
          setError(data.error);
        } else {
          setIsLockedOut(false);
          setError(data.error || "Login gagal. Silakan coba lagi.");
        }
        setLoading(false);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
        poster="/wallpapers/login-bg.jpg"
      >
        <source src="/wallpapers/video_wall.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50" />

      <Card className="relative w-full max-w-md shadow-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <CardHeader className="space-y-3 text-center pb-4 pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900">
            <Shield className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">
            YourVoice Admin
          </CardTitle>
          <CardDescription>
            Login untuk mengelola laporan
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`flex items-center gap-2 p-3 text-sm rounded-lg ${
                isLockedOut 
                  ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200" 
                  : "text-red-500 bg-red-50 dark:bg-red-900/20"
              }`}>
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isLockedOut && remainingSeconds > 0 && (
              <div className="flex items-center justify-center gap-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <Timer className="h-5 w-5 text-slate-600 dark:text-slate-400 animate-pulse" />
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Tunggu sebelum mencoba lagi
                  </p>
                  <p className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatTime(remainingSeconds)}
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="YourVoiceadmin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || isLockedOut}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || isLockedOut}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-white border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || isLockedOut || checkingLockout}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : isLockedOut ? (
                <>
                  <Timer className="mr-2 h-4 w-4" />
                  Terkunci ({formatTime(remainingSeconds)})
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Masuk
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Sistem hanya untuk administrator yang berwenang.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sesi akan berakhir saat browser ditutup.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
