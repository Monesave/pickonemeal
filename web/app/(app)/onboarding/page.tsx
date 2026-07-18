"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function OnboardingPage() {
  const { signInWithEmail, signUpWithEmail, loading, session } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (session) {
    router.replace("/home");
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.replace("/home");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Get started</h1>
        <p className="text-neutral-300">
          {mode === "signin"
            ? "Sign in to plan meals and join Dining Tables."
            : "Create an account to start swiping meals."}
        </p>
      </div>

      <div className="flex gap-2 text-xs">
        <button
          type="button"
          className={`flex-1 rounded border px-3 py-2 ${
            mode === "signin"
              ? "border-neutral-200 bg-neutral-100 text-neutral-900"
              : "border-neutral-700 text-neutral-300"
          }`}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded border px-3 py-2 ${
            mode === "signup"
              ? "border-neutral-200 bg-neutral-100 text-neutral-900"
              : "border-neutral-700 text-neutral-300"
          }`}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1 text-sm">
          <label className="block text-neutral-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-300"
          />
        </div>
        <div className="space-y-1 text-sm">
          <label className="block text-neutral-300">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-neutral-300"
          />
        </div>
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
        >
          {loading
            ? "Working..."
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>
      </form>
    </div>
  );
}



