"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type TableStatus = "not_started" | "active" | "completed" | "archived";

type TableDetail = {
  id: string;
  name: string;
  date: string;
  meal_slot: string;
  status: TableStatus;
  owner_id: string;
  invite_token: string;
};

type Participant = {
  id: string;
  display_name: string | null;
  is_owner: boolean;
};

type Round = {
  id: string;
  round_number: number;
  status: string;
  decided_meal_title: string | null;
  decision_reason: string | null;
};

export default function TableDetailPage() {
  const params = useParams<{ id: string }>();
  const tableId = params?.id;
  const { session } = useAuth();

  const [table, setTable] = useState<TableDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingRound, setStartingRound] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [yearPoints, setYearPoints] = useState<number | null>(null);

  const isOwner = table && session && table.owner_id === session.user.id;

  useEffect(() => {
    if (!session || !tableId) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      const [
        { data: tableRow, error: tableError },
        { data: participantRows },
        { data: roundRows, error: roundError },
        { data: profileRow }
      ] =
        await Promise.all([
          supabase
            .from("dining_tables")
            .select("*")
            .eq("id", tableId)
            .maybeSingle(),
          supabase
            .from("dining_table_participants")
            .select(
              `
              id,
              role,
              profiles:profiles!inner(id, display_name)
            `
            )
            .eq("table_id", tableId),
          supabase
            .from("voting_rounds")
            .select(
              `
              id,
              round_number,
              status,
              decision_reason,
              meals:decided_meal_id(title)
            `
            )
            .eq("table_id", tableId)
            .order("round_number", { ascending: false }),
          supabase
            .from("profiles")
            .select("gamification_points_year")
            .eq("id", session.user.id)
            .maybeSingle()
        ]);

      if (tableError || !tableRow) {
        console.error(tableError);
        setError("Unable to load table.");
        setLoading(false);
        return;
      }

      if (roundError) {
        console.error(roundError);
      }

      setTable({
        id: tableRow.id,
        name: tableRow.name,
        date: tableRow.date,
        meal_slot: tableRow.meal_slot,
        status: tableRow.status,
        owner_id: tableRow.owner_id,
        invite_token: tableRow.invite_token
      });

      setParticipants(
        (participantRows ?? []).map((p: any) => ({
          id: p.profiles.id,
          display_name: p.profiles.display_name,
          is_owner: p.role === "owner"
        }))
      );

      setRounds(
        (roundRows ?? []).map((r: any) => ({
          id: r.id,
          round_number: r.round_number,
          status: r.status,
          decided_meal_title: Array.isArray(r.meals) ? r.meals[0]?.title ?? null : (r.meals as any)?.title ?? null,
          decision_reason: r.decision_reason
        }))
      );

      if (profileRow) {
        setYearPoints((profileRow as any).gamification_points_year ?? 0);
      }

      setLoading(false);
    };

    void fetchDetail();
  }, [session, tableId]);

  useEffect(() => {
    if (!table) return;
    if (typeof window === "undefined") return;
    const base = window.location.origin;
    setInviteUrl(`${base}/table/${table.id}?token=${table.invite_token}`);
  }, [table]);

  const handleStartRound = async () => {
    if (!session || !tableId) return;
    setStartingRound(true);

    try {
      const { data: round, error } = await supabase.rpc("start_round", {
        p_table_id: tableId
      });

      if (error || !round) {
        console.error(error);
        setError("Failed to start a new round.");
        return;
      }

      const created = round as any;
      setRounds((prev) => [
        {
          id: created.id,
          round_number: created.round_number,
          status: created.status,
          decided_meal_title: null,
          decision_reason: null
        },
        ...prev
      ]);
    } finally {
      setStartingRound(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-64 rounded-xl bg-white/40 backdrop-blur-sm animate-pulse" />
        <div className="h-32 rounded-2xl bg-white/40 backdrop-blur-sm animate-pulse shadow-sm" />
        <div className="h-40 rounded-2xl bg-white/40 backdrop-blur-sm animate-pulse shadow-sm" />
      </div>
    );
  }

  if (!table) {
    return (
      <p className="text-sm text-red-500 font-medium" role="alert">
        {error ?? "Table not found."}
      </p>
    );
  }

  return (
    <div className="space-y-7">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-800">{table.name}</h1>
        <p className="text-sm text-slate-400 font-medium">
          {table.date} • <span className="capitalize">{table.meal_slot}</span> • <span className="capitalize">{table.status.replace("_", " ")}</span>
        </p>
        {yearPoints != null && (
          <p className="text-xs text-slate-400 font-medium">
            This year:{" "}
            <span className="font-bold text-slate-700">{yearPoints}</span> points
          </p>
        )}
        {isOwner && (
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500">👑 You are the table owner.</p>
        )}
      </header>

      {inviteUrl && (
        <section className="space-y-2.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h2 className="text-sm font-bold text-slate-700">
            Invite link
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Share this link so others can join this Dining Table.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 truncate rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-slate-500 font-medium">
              {inviteUrl}
            </div>
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.97]"
              onClick={() => {
                if (navigator?.clipboard) {
                  void navigator.clipboard.writeText(inviteUrl);
                }
              }}
            >
              Copy
            </button>
          </div>
        </section>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}

      <section className="space-y-2.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <h2 className="text-sm font-bold text-slate-700">Participants</h2>
        {participants.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium">
            No participants yet. Share the invite link to invite others.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs">
            {participants.map((p) => (
              <span
                key={p.id}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-slate-600 font-medium shadow-sm"
              >
                {p.display_name ?? "Anonymous"}
                {p.is_owner && (
                  <span className="ml-1 text-[10px] uppercase font-bold text-rose-500">
                    owner
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-700">
              Voting rounds
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              New rounds run for 1 hour and will eventually pick a winner by
              consensus or timeout.
            </p>
          </div>
          {isOwner && (
            <button
              type="button"
              disabled={startingRound}
              onClick={() => void handleStartRound()}
              className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              {startingRound ? "Starting…" : "Start new round"}
            </button>
          )}
        </div>
        {rounds.length === 0 ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-purple-50 flex items-center justify-center text-lg">🗳️</div>
            <p className="text-xs text-slate-400 font-medium">
              No rounds yet. Start one to begin voting.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 text-sm">
            {rounds.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-white/70 border border-white/50 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-px"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    Round {r.round_number} • <span className="capitalize">{r.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {r.decided_meal_title
                      ? `🏆 Winner: ${r.decided_meal_title} (${r.decision_reason ?? "consensus"})`
                      : "No winner yet"}
                  </div>
                </div>
                <Link
                  href={`/tables/${table.id}/rounds/${r.id}`}
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-md"
                >
                  Vote
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


