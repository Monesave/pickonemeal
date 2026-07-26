"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import { ChefHat, Zap, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function LandingPage() {
  const { session, signUpWithEmail, signInWithEmail, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    if (session) router.replace("/home");
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signin") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
      router.replace("/home");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-mesh overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full">
        <div className="glass border-b border-white/5">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <button
              onClick={() => {
                setShowAuth(false);
                setError(null);
                setEmail("");
                setPassword("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                <ChefHat size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">pickonemeal</span>
            </button>

            <nav className="flex items-center gap-3">
              {!session && (
                <>
                  <button
                    onClick={() => { setMode("signin"); setShowAuth(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="text-sm font-medium text-slate-300 transition hover:text-white"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => { setMode("signup"); setShowAuth(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    Get started
                  </button>
                </>
              )}
              {session && (
                <Link href="/home" className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
                  Go to App <ArrowRight size={14} />
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────── */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24">
        {/* Background blobs */}
        <motion.div style={{ y }} className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-orange-500/8 blur-[100px]" />
          <div className="absolute -right-40 top-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/6 blur-[80px]" />
          <div className="absolute bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[80px]" />
        </motion.div>

        <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-300"
          >
            <Zap size={13} fill="currentColor" />
            Swipe · Vote · Eat together
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-6xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl lg:text-8xl"
          >
            Stop arguing
            <br />
            <span className="gradient-text-hero">what to eat.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl"
          >
            A Tinder-style group meal decision app. Swipe together, vote as a family,
            and let the algorithm decide — in seconds.
          </motion.p>

          {/* Auth form */}
          {showAuth && !session ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mx-auto max-w-md"
            >
              <div className="glass-bright rounded-3xl p-6 shadow-card">
                {/* Tabs */}
                <div className="mb-5 flex gap-1 rounded-xl bg-slate-800/60 p-1">
                  {(["signup", "signin"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setError(null); }}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                        mode === m
                          ? "bg-white text-slate-900 shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {m === "signup" ? "Create account" : "Sign in"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    autoComplete="username"
                    className="input-field"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Password (6+ characters)" : "Password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                    {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create free account"}
                  </button>
                </form>

                <button
                  onClick={() => setShowAuth(false)}
                  className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          ) : (
            /* CTA buttons */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <button
                onClick={() => { setMode("signup"); setShowAuth(true); }}
                className="btn-primary flex items-center gap-2 px-8 py-4 text-lg"
              >
                Start free — it&apos;s quick
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-secondary px-8 py-4 text-lg"
              >
                See how it works
              </button>
            </motion.div>
          )}

          {/* Floating food emoji cards — pure CSS for GPU-smooth animation */}
          {!showAuth && (
            <div className="food-cards-wrapper mt-16 flex justify-center gap-3 sm:gap-5">
              {[
                { emoji: "🍕", label: "Pizza",  delay: "0s" },
                { emoji: "🍣", label: "Sushi",  delay: "0.4s" },
                { emoji: "🥗", label: "Salad",  delay: "0.8s" },
                { emoji: "🍜", label: "Ramen",  delay: "1.2s" },
                { emoji: "🌮", label: "Tacos",  delay: "1.6s" },
              ].map(({ emoji, label, delay }) => (
                <div
                  key={label}
                  className="food-card glass-bright flex flex-col items-center gap-1 rounded-2xl px-3 py-3 sm:px-4 sm:py-4"
                  style={{ animationDelay: delay }}
                >
                  <span className="text-3xl sm:text-4xl">{emoji}</span>
                  <span className="text-[10px] font-medium text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────── */}
      <FeaturesSection />

      {/* ── FAQ ─────────────────────────────────── */}
      <FAQSection />

      {/* ── Footer ──────────────────────────────── */}
      <footer className="border-t border-white/5 bg-slate-950 py-12">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <ChefHat size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">pickonemeal</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Pick One Meal · Made with ❤️ for food lovers
          </p>
        </div>
      </footer>
    </div>
  );
}