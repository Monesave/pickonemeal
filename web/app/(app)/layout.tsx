"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { session, profile, signOut, loading } = useAuth();
  const router = useRouter();

  if (!loading && !session) {
    router.replace("/app/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <Link href="/app/home" className="font-semibold">
          pickonemeal
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-3 text-sm text-neutral-300">
          <Link href="/app/home">Home</Link>
          <Link href="/app/swipe">Swipe</Link>
          <Link href="/app/tables">Tables</Link>
          <Link href="/app/history">History</Link>
          <Link href="/app/profile">Profile</Link>
        </nav>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          {profile?.display_name && (
            <span className="hidden sm:inline">
              {profile.display_name}
            </span>
          )}
          {session && (
            <button
              type="button"
              onClick={signOut}
              className="rounded border border-neutral-600 px-2 py-1 text-[11px] hover:border-neutral-400"
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}



