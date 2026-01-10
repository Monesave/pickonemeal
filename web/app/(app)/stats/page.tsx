"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  table_id: string | null;
  table_name: string | null;
  season_year: number;
  total_points: number;
  meals_won: number;
  participation_rounds: number;
};

export default function StatsPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase.rpc("get_gamification_summary", {
        p_user_id: session.user.id,
        p_season_year: currentYear
      });

      if (error) {
        console.error(error);
        setError("Failed to load stats.");
        setLoading(false);
        return;
      }

      setRows((data ?? []) as Row[]);
      setLoading(false);
    };

    void load();
  }, [session]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.points += r.total_points ?? 0;
          acc.meals += r.meals_won ?? 0;
          acc.rounds += r.participation_rounds ?? 0;
          return acc;
        },
        { points: 0, meals: 0, rounds: 0 }
      ),
    [rows]
  );

  if (!session) {
    return (
      <p className="text-sm text-neutral-300">
        Please sign in to view your stats.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">My Points</h1>
        <p className="text-sm text-neutral-300">
          Gamification points for this year across your Dining Tables.
        </p>
      </header>

      {loading ? (
        <p className="text-neutral-400">Loading stats…</p>
      ) : error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : (
        <>
          <section className="space-y-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            <h2 className="text-sm font-semibold text-neutral-100">Summary</h2>
            <p className="text-sm text-neutral-300">
              Points: <span className="font-semibold">{totals.points}</span>{" "}
              • Meals won:{" "}
              <span className="font-semibold">{totals.meals}</span> •
              Participation rounds:{" "}
              <span className="font-semibold">{totals.rounds}</span>
            </p>
          </section>

          {rows.length === 0 ? (
            <p className="text-sm text-neutral-400">
              You don&apos;t have any points yet this year.
            </p>
          ) : (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-neutral-100">
                By Dining Table
              </h2>
              <div className="space-y-2 text-sm">
                {rows.map((r) => (
                  <div
                    key={(r.table_id ?? "global") + r.season_year}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2"
                  >
                    <div className="font-medium text-neutral-100">
                      {r.table_name ?? "All tables"}
                    </div>
                    <div className="text-xs text-neutral-400">
                      Points: {r.total_points} • Meals won: {r.meals_won} •
                      Rounds: {r.participation_rounds}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}


