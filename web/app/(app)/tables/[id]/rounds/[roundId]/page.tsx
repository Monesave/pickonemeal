"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type Meal = {
  id: string;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
};

type RoundInfo = {
  id: string;
  status: "active" | "completed" | "timeout";
  ends_at?: string | null;
  decided_meal_title: string | null;
  decision_reason: string | null;
};

type TableInfo = {
  id: string;
  name: string;
};

export default function RoundVotingPage() {
  const { id: tableId, roundId } = useParams<{
    id: string;
    roundId: string;
  }>();
  const { session } = useAuth();
  const router = useRouter();

  const [table, setTable] = useState<TableInfo | null>(null);
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, "like" | "dislike" | "skip">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consensusMessage, setConsensusMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const currentMeal = meals[currentIndex];

  useEffect(() => {
    if (!session || !tableId || !roundId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setConsensusMessage(null);
      setShowConfetti(false);

      // Load table and round
      const [{ data: tableRow }, { data: roundRow, error: roundErr }] =
        await Promise.all([
          supabase
            .from("dining_tables")
            .select("id,name")
            .eq("id", tableId)
            .maybeSingle(),
          supabase
            .from("voting_rounds")
            .select(
              `
              id,
              status,
              decision_reason,
              meals:decided_meal_id(title)
            `
            )
            .eq("id", roundId)
            .maybeSingle()
        ]);

      if (!tableRow || roundErr || !roundRow) {
        setError("Unable to load voting round.");
        setLoading(false);
        return;
      }

      setTable({ id: tableRow.id, name: tableRow.name });
      setRound({
        id: roundRow.id,
        status: roundRow.status,
        ends_at: (roundRow as any).ends_at ?? null,
        decided_meal_title: Array.isArray(roundRow.meals) ? roundRow.meals[0]?.title ?? null : (roundRow.meals as any)?.title ?? null,
        decision_reason: roundRow.decision_reason
      });

      // Candidate meals
      const { data: rmRows, error: rmErr } = await supabase
        .from("round_meals")
        .select(
          `
          meal_id,
          meals (
            id,
            title,
            description,
            prep_time_minutes
          )
        `
        )
        .eq("round_id", roundId);

      if (rmErr) {
        setError("Unable to load meals for this round.");
        setLoading(false);
        return;
      }

      const candidates: Meal[] =
        rmRows?.map((r: any) => ({
          id: r.meals.id,
          title: r.meals.title,
          description: r.meals.description,
          prep_time_minutes: r.meals.prep_time_minutes
        })) ?? [];

      // Existing votes for this user
      const { data: voteRows } = await supabase
        .from("round_votes")
        .select("meal_id, vote")
        .eq("round_id", roundId)
        .eq("user_id", session.user.id);

      const voteMap: Record<string, "like" | "dislike" | "skip"> = {};
      voteRows?.forEach((v: any) => {
        voteMap[v.meal_id] = v.vote;
      });

      setMeals(candidates);
      setVotes(voteMap);

      // Move to first unvoted meal for this user
      const firstUnvotedIndex = candidates.findIndex((m) => !voteMap[m.id]);
      setCurrentIndex(firstUnvotedIndex === -1 ? 0 : firstUnvotedIndex);

      setLoading(false);
    };

    void fetchData();
  }, [session, tableId, roundId]);

  const allVotedByUser = useMemo(
    () => meals.length > 0 && meals.every((m) => votes[m.id]),
    [meals, votes]
  );

  const handleVote = async (vote: "like" | "dislike" | "skip") => {
    if (!session || !roundId || !tableId || !currentMeal || saving) return;
    if (round?.status !== "active") return;

    setSaving(true);
    setError(null);

    try {
      const { error: upsertErr } = await supabase.from("round_votes").upsert(
        {
          round_id: roundId,
          table_id: tableId,
          meal_id: currentMeal.id,
          user_id: session.user.id,
          vote
        },
        { onConflict: "round_id,meal_id,user_id" }
      );

      if (upsertErr) {
        setError("Failed to record your vote.");
        setSaving(false);
        return;
      }

      setVotes((prev) => ({ ...prev, [currentMeal.id]: vote }));

      // Move to next unvoted meal for this user
      const nextIndex = meals.findIndex(
        (m, idx) => idx > currentIndex && !votes[m.id]
      );
      if (nextIndex !== -1) {
        setCurrentIndex(nextIndex);
      }

      await checkConsensusOrSuggest();
    } finally {
      setSaving(false);
    }
  };

  const checkConsensusOrSuggest = async () => {
    if (!roundId || !tableId) return;

    // All votes for this round
    const { data: allVotes, error: votesErr } = await supabase
      .from("round_votes")
      .select("meal_id, user_id, vote")
      .eq("round_id", roundId);

    if (votesErr || !allVotes) return;

    // All participants
    const { data: participants, error: partErr } = await supabase
      .from("dining_table_participants")
      .select("user_id")
      .eq("table_id", tableId);

    if (partErr || !participants) return;

    const participantIds = participants.map((p: any) => p.user_id);

    // Determine consensus: every participant has vote 'like' for same meal
    const likesByMeal: Record<string, Set<string>> = {};
    for (const v of allVotes) {
      if (v.vote === "like") {
        if (!likesByMeal[v.meal_id]) likesByMeal[v.meal_id] = new Set();
        likesByMeal[v.meal_id].add(v.user_id);
      }
    }

    const consensusMealId = Object.entries(likesByMeal).find(
      ([, userSet]) => participantIds.every((id) => userSet.has(id))
    )?.[0];

    if (consensusMealId) {
      const meal = meals.find((m) => m.id === consensusMealId);
      await supabase
        .from("voting_rounds")
        .update({
          decided_meal_id: consensusMealId,
          decision_reason: "consensus",
          status: "completed"
        })
        .eq("id", roundId);

      setRound((prev) =>
        prev
          ? {
              ...prev,
              decided_meal_title: meal?.title ?? prev.decided_meal_title,
              decision_reason: "consensus",
              status: "completed"
            }
          : prev
      );

      setConsensusMessage(
        `Everyone agreed on ${meal?.title ?? "this meal"}! Your points have been updated.`
      );
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
      return;
    }

    // If no consensus and every participant has voted on every meal, ask OpenAI for a suggestion.
    const votesByUser: Record<string, number> = {};
    for (const v of allVotes) {
      votesByUser[v.user_id] = (votesByUser[v.user_id] ?? 0) + 1;
    }
    const allParticipantsVotedAllMeals =
      meals.length > 0 &&
      participantIds.every(
        (id) => (votesByUser[id] ?? 0) >= meals.length
      );

    if (allParticipantsVotedAllMeals) {
      try {
        const res = await fetch("/api/suggest-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableName: table?.name ?? "Dining Table",
            mealTitles: meals.map((m) => m.title)
          })
        });

        const data = await res.json();
        if (res.ok && data?.suggestedMeal) {
          setConsensusMessage(
            `No agreement found. OpenAI suggests: ${data.suggestedMeal}`
          );
        } else {
          setConsensusMessage(
            "No agreement found and AI suggestion is unavailable."
          );
        }
      } catch {
        setConsensusMessage(
          "No agreement found and AI suggestion failed."
        );
      }
    }
  };

  if (!session) {
    router.replace("/onboarding");
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl bg-white/40 backdrop-blur-sm animate-pulse" />
        <div className="max-w-md h-64 rounded-2xl bg-white/40 backdrop-blur-sm animate-pulse shadow-sm" />
      </div>
    );
  }

  if (!round || !table) {
    return (
      <p className="text-sm text-red-500 font-medium" role="alert">
        {error ?? "Round not found."}
      </p>
    );
  }
  return (
    <div className="space-y-7">
      <header className="space-y-1.5">
        <Link
          href={`/tables/${table.id}`}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back to table
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">{table.name}</h1>
        <p className="text-sm text-slate-400 font-medium">
          Round status: <span className="capitalize font-semibold text-slate-600">{round.status}</span>
          {round.decided_meal_title && (
            <> • 🏆 Winner: <span className="font-semibold text-slate-700">{round.decided_meal_title}</span></>
          )}
        </p>
      </header>

      {consensusMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
          {consensusMessage}
        </div>
      )}

      {showConfetti && (
        <div className="confetti-overlay">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 100) / 24}%`,
                animationDelay: `${(i % 5) * 0.05}s`
              }}
            >
              {i % 3 === 0 ? "🎉" : i % 3 === 1 ? "✨" : "🥘"}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}

      {round.status !== "active" ? (
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-gradient-to-br from-slate-100 to-purple-50 flex items-center justify-center text-2xl">🏁</div>
          <p className="text-sm text-slate-400 font-medium">
            This round is no longer active.
          </p>
        </div>
      ) : !currentMeal ? (
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-gradient-to-br from-slate-100 to-purple-50 flex items-center justify-center text-2xl">✅</div>
          <p className="text-sm text-slate-400 font-medium">
            You&apos;ve voted on all meals in this round.
          </p>
        </div>
      ) : (
        <div className="max-w-md rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-3">
          <h2 className="text-lg font-bold text-slate-800">{currentMeal.title}</h2>
          {currentMeal.description && (
            <p className="text-sm text-slate-400 leading-relaxed">
              {currentMeal.description}
            </p>
          )}
          {currentMeal.prep_time_minutes != null && (
            <p className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 rounded-full px-2.5 py-0.5 border border-slate-100 font-medium">
              ⏱️ Prep time: {currentMeal.prep_time_minutes} min
            </p>
          )}

          <div className="pt-2 flex justify-between gap-2.5">
            <button
              type="button"
              disabled={saving}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
              onClick={() => void handleVote("dislike")}
            >
              Dislike
            </button>
            <button
              type="button"
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-white hover:border-slate-300 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
              onClick={() => void handleVote("skip")}
            >
              Skip
            </button>
            <button
              type="button"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
              onClick={() => void handleVote("like")}
            >
              Like
            </button>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Card {currentIndex + 1} of {meals.length}
            {allVotedByUser && " • You've voted on all meals in this round."}
          </p>
        </div>
      )}
    </div>
  );
}


