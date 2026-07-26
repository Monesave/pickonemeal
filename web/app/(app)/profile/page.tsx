"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type ProfileStats = {
  display_name: string | null;
  followers_count: number;
  following_count: number;
  gamification_points_year: number;
  is_leading_chef: boolean;
  chef_status: string;
};

export default function ProfilePage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "display_name, followers_count, following_count, gamification_points_year, is_leading_chef, chef_status"
        )
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !data) {
        console.error(error);
        setError("Failed to load profile stats.");
        setLoading(false);
        return;
      }

      setStats(data as ProfileStats);
      setLoading(false);
    };

    void load();
  }, [session]);

  if (!session) {
    return (
      <p className="text-sm text-neutral-300">
        Please sign in to view your profile.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="mb-2 text-2xl font-semibold">Profile & settings</h1>

      {loading ? (
        <p className="text-neutral-400">Loading your stats…</p>
      ) : error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : stats ? (
        <>
          <section className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-100">
              Account
            </h2>
            <p className="text-sm text-neutral-300">
              {stats.display_name ?? session.user.email}
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-100">
              My Points (Gamification)
            </h2>
            <p className="text-sm text-neutral-300">
              This year:{" "}
              <span className="font-semibold">
                {stats.gamification_points_year ?? 0}
              </span>{" "}
              points
            </p>
            <p className="text-xs text-neutral-400">
              <a
                href="/stats"
                className="underline decoration-neutral-500 hover:decoration-neutral-200"
              >
                View my detailed stats
              </a>
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-100">
              Social
            </h2>
            <p className="text-sm text-neutral-300">
              Followers:{" "}
              <span className="font-semibold">
                {stats.followers_count ?? 0}
              </span>{" "}
              • Following:{" "}
              <span className="font-semibold">
                {stats.following_count ?? 0}
              </span>
            </p>
            {stats.is_leading_chef && stats.chef_status === "active" && (
              <p className="text-xs text-amber-300">⭐ Leading Chef</p>
            )}
          </section>
        </>
      ) : null}

      <p className="text-xs text-neutral-500">
        Dietary preferences and additional settings will be added here later.
      </p>
    </div>
  );
}

