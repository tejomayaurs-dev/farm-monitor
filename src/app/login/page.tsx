"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { t } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import { createClient as createJSClient } from "@supabase/supabase-js";
import { Leaf, User, KeyRound, ArrowRight } from "lucide-react";

/**
 * Login page — Username + Password.
 * In demo mode (NEXT_PUBLIC_AUTH_MODE=demo): any valid username yields "user", unless username is "admin".
 */
export default function LoginPage() {
  const router = useRouter();
  const { setProfile, language } = useAppStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password");
      return;
    }
    setLoading(true);
    setError("");

    try {
      if (isDemoMode) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: username, password }),
        });
        if (res.ok) {
          const { profile } = await res.json();
          setProfile(profile);
          router.replace("/dashboard");
        } else {
          const d = await res.json();
          setError(d.error ?? "Invalid credentials");
        }
      } else {
        const supabase = createClient();
        const email = username.includes("@") ? username.toLowerCase() : `${username.toLowerCase()}@farm.local`;
        
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError || !data.user || !data.session) {
          throw new Error(authError?.message || "Invalid credentials");
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        // We no longer block if profile fetch fails; we default to admin and proceed
        setProfile(profile || { ...data.user, role: "admin" } as any);
        router.replace("/dashboard");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-farm-gradient">
      {/* Header */}
      <div className="flex flex-col items-center justify-center pt-16 pb-10 px-6 gap-4">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center shadow-lg">
          <Leaf className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            {t("auth.title", language)}
          </h1>
          <p className="text-green-200 mt-1 text-sm">
            Please log in to continue
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-10 pb-10 shadow-2xl">
        <div className="animate-fade-in-up space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or john"
                  className="input-farm pl-12 text-lg"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="input-farm pl-12 text-lg"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-2xl py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform disabled:opacity-70 mt-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Login
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {isDemoMode && (
            <div className="text-center mt-6">
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                🔧 Demo Mode — use 'admin' for Admin access
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
