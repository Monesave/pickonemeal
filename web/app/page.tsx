"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import FeaturesSection from "@/components/FeaturesSection";
import FAQSection from "@/components/FAQSection";
import HelpDropdown from "@/components/HelpDropdown";

export default function LandingPage() {
  const { session, signUpWithEmail, signInWithEmail, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (session) {
      router.replace("/app/home");
    }
  }, [session, router]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.replace("/app/home");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-white">
            🍽️ Pick One Meal
          </Link>
          <div className="flex items-center gap-4">
            <HelpDropdown />
            {!session && (
              <button
                onClick={() => {
                  setShowAuth(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
              >
                Get Started
              </button>
            )}
            {session && (
              <Link
                href="/app/home"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
              >
                Go to App
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
            style={{
              transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.1}px)`,
            }}
          />
          <div
            className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
            style={{
              transform: `translate(${-scrollY * 0.1}px, ${-scrollY * 0.1}px)`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="animate-fade-in-up mb-6">
            <h1 className="mb-4 text-5xl font-bold leading-tight text-white md:text-7xl">
              Swipe together.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Decide dinner fast.
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-neutral-300 md:text-xl">
              Help couples, families, and friends agree on one home-made meal.
              Swipe, vote, and enjoy together.
            </p>
          </div>

          {/* Auth Form */}
          {showAuth && !session && (
            <div className="animate-fade-in-up mx-auto mb-8 max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm">
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    mode === "signup"
                      ? "bg-white text-neutral-900"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    mode === "signin"
                      ? "bg-white text-neutral-900"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  Sign In
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-white placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-white placeholder-neutral-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-3 font-medium text-white transition hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50"
                >
                  {loading
                    ? "Working..."
                    : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </button>
              </form>
            </div>
          )}

          {/* CTA Buttons */}
          {!showAuth && !session && (
            <div className="animate-fade-in-up-delay flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => setShowAuth(true)}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:scale-105 hover:from-emerald-600 hover:to-blue-600"
              >
                Get Started Free
              </button>
              <button
                onClick={() => {
                  const featuresElement = document.getElementById("features");
                  featuresElement?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-lg border border-neutral-700 bg-neutral-900/50 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition hover:border-neutral-600 hover:bg-neutral-800/50"
              >
                Learn More
              </button>
            </div>
          )}

          {/* Scroll indicator */}
          <div className="animate-bounce-slow absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="h-8 w-0.5 bg-neutral-600" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-neutral-400">
            © {new Date().getFullYear()} Pick One Meal. Made with ❤️ for food
            lovers.
          </p>
        </div>
      </footer>
    </div>
  );
}
