"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, LogIn, UserPlus, KeyRound, AlertCircle, Loader2 } from "lucide-react";

interface AuthModalProps {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Automatically attempt sign-in if email confirmation isn't strictly required
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setErrorMsg("Account created! Check your email or try signing in.");
          setIsSignUp(false);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If default demo account doesn't exist yet, try signing up for them seamlessly
          if (email === "officer@drishti.gov.in" && error.message.toLowerCase().includes("invalid login credentials")) {
            const { error: autoSignUpErr } = await supabase.auth.signUp({ email, password });
            if (!autoSignUpErr) {
              const { error: secondLoginErr } = await supabase.auth.signInWithPassword({ email, password });
              if (!secondLoginErr) {
                onSuccess();
                return;
              }
            }
          }
          throw error;
        }
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccess = async () => {
    setLoading(true);
    setErrorMsg(null);
    const demoEmail = "officer@drishti.gov.in";
    const demoPass = "Chakravyuh2026!";

    try {
      // First try signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });

      if (signInError) {
        // If not found, create the test account
        const { error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPass,
        });
        if (signUpError && !signUpError.message.includes("already registered")) {
          throw signUpError;
        }
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPass,
        });
        if (retryError) throw retryError;
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Quick demo access failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
        <div className="p-6 bg-gradient-to-b from-neutral-800 to-neutral-900 border-b border-neutral-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">DRISHTI / SatQuery</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Chakravyuh 2026 &bull; National Geospatial Intelligence Hub
          </p>
          <div className="mt-3 inline-block px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-medium text-emerald-300">
            Official Officer Authentication Required (RLS Protected)
          </div>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleQuickDemoAccess}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            <span>1-Click Hackathon Demo Access</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-900 px-3 text-neutral-500 font-medium">
                Or custom credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Officer Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@drishti.gov.in"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" /> Register New Officer Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Platform
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs text-neutral-400 hover:text-emerald-400 underline underline-offset-4 cursor-pointer"
            >
              {isSignUp
                ? "Already have an officer account? Sign in"
                : "Need a new account? Register here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
