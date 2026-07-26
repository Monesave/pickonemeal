"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { session, profile, signOut, loading } = useAuth();
  const router = useRouter();

  if (!loading && !session) {
    router.replace("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#E8E4F0] via-[#DDE6F5] to-[#F0EEFA] text-slate-800">
      <header className="flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/40 px-5 py-3.5 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
        <Link href="/home" className="font-bold text-lg bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          pickonemeal
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-1 text-sm">
          {[
            { href: "/home", label: "Home" },
            { href: "/swipe", label: "Swipe" },
            { href: "/tables", label: "Tables" },
            { href: "/history", label: "History" },
            { href: "/profile", label: "Profile" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 font-medium text-slate-500 transition-all duration-200 hover:bg-white/60 hover:text-slate-800 hover:shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {profile?.display_name && (
            <span className="hidden sm:inline font-medium text-slate-600">
              {profile.display_name}
            </span>
          )}
          {session && (
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-700"
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 px-5 py-7">{children}</main>
    </div>
  );
}



