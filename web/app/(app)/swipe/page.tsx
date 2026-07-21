"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type MealSlot = "breakfast" | "lunch" | "dinner";

type Meal = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
};

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];
const DAILY_LIMIT = 3;

function SwipeContent() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  
  const initialSlot = useMemo<MealSlot>(() => {
    const s = searchParams.get("slot")?.toLowerCase();
    if (s === "breakfast" || s === "lunch" || s === "dinner") return s;
    return "dinner";
  }, [searchParams]);

  const [selectedSlot, setSelectedSlot] = useState<MealSlot>(initialSlot);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swipeCount, setSwipeCount] = useState<number>(0);
  const [decidedMeals, setDecidedMeals] = useState<Record<MealSlot, string | null>>({
    breakfast: null,
    lunch: null,
    dinner: null
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const todayIso = useMemo(
    () => format(new Date(), "yyyy-MM-dd"),
    []
  );

  const fetchDailyPlans = async () => {
    if (!session) return;
    const { data } = await supabase
      .from("user_daily_plans")
      .select("meal_slot, status, meals(title)")
      .eq("user_id", session.user.id)
      .eq("date", todayIso);

    const map: Record<MealSlot, string | null> = {
      breakfast: null,
      lunch: null,
      dinner: null
    };

    data?.forEach((row: any) => {
      if (row.status === "decided" && (row.meal_slot in map)) {
        const meal = Array.isArray(row.meals) ? row.meals[0] : row.meals;
        map[row.meal_slot as MealSlot] = meal?.title ?? "Selected meal";
      }
    });

    setDecidedMeals(map);
  };

  useEffect(() => {
    if (!session) return;

    const init = async () => {
      setLoading(true);
      setError(null);

      const [{ data: counter }, { data: mealRows, error: mealsError }] =
        await Promise.all([
          supabase
            .from("user_swipe_counters")
            .select("swipe_count")
            .eq("user_id", session.user.id)
            .eq("date", todayIso)
            .maybeSingle(),
          supabase
            .from("meals")
            .select("id, title, description, image_url, prep_time_minutes")
            .eq("is_active", true)
            .limit(20)
        ]);

      if (mealsError) {
        setError("Failed to load meals.");
        console.error(mealsError);
        setLoading(false);
        return;
      }

      setSwipeCount(counter?.swipe_count ?? 0);
      setMeals(mealRows ?? []);
      setCurrentIndex(0);
      await fetchDailyPlans();
      setLoading(false);
    };

    void init();
  }, [session, todayIso]);

  const remaining = DAILY_LIMIT - swipeCount;
  const currentMeal = meals[currentIndex];

  const canSwipe = !!session && remaining > 0;

  const advance = () => {
    setCurrentIndex((prev) => (prev + 1 < meals.length ? prev + 1 : prev));
  };

  const recordDecision = async (
    decision: "like" | "skip" | "dislike"
  ) => {
    if (!session || !currentMeal) return;
    if (!canSwipe && decision === "like") return;

    setSuccessMsg(null);

    const status =
      decision === "like" ? "decided" : decision === "skip" ? "skipped" : "none";

    const mealId = decision === "like" ? currentMeal.id : null;

    const { error: upsertError } = await supabase.from("user_daily_plans").upsert(
      {
        user_id: session.user.id,
        date: todayIso,
        meal_slot: selectedSlot,
        status,
        meal_id: mealId
      },
      { onConflict: "user_id,date,meal_slot" }
    );

    if (upsertError) {
      console.error(upsertError);
      setError("Failed to save your choice.");
      return;
    }

    if (decision === "like") {
      setSuccessMsg(`Set "${currentMeal.title}" for ${selectedSlot.toUpperCase()}!`);
      setDecidedMeals((prev) => ({ ...prev, [selectedSlot]: currentMeal.title }));

      const { data, error: counterError } = await supabase
        .from("user_swipe_counters")
        .upsert(
          {
            user_id: session.user.id,
            date: todayIso,
            swipe_count: swipeCount + 1
          },
          { onConflict: "user_id,date" }
        )
        .select("swipe_count")
        .maybeSingle();

      if (counterError) {
        console.error(counterError);
      } else if (data) {
        setSwipeCount(data.swipe_count);
      } else {
        setSwipeCount((c) => c + 1);
      }
    }

    advance();
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Swipe & Plan Meals</h1>
          <Link
            href="/home"
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            ← Back to Home
          </Link>
        </div>
        <p className="text-sm text-neutral-300">
          Select a meal slot below and swipe meals to set your daily plan. You can pick up to{" "}
          <span className="font-semibold text-emerald-400">{DAILY_LIMIT}</span> meals per day.
        </p>
      </header>

      {/* Slot Selector Tabs */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-neutral-400">Target slot:</span>
          {SLOTS.map((slot) => {
            const decidedName = decidedMeals[slot];
            const isSelected = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                className={`rounded-full border px-3.5 py-1.5 capitalize transition-all ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-500/20 font-semibold text-emerald-200"
                    : "border-neutral-700 bg-neutral-900/60 text-neutral-300 hover:border-neutral-500"
                }`}
                onClick={() => {
                  setSelectedSlot(slot);
                  setSuccessMsg(null);
                }}
              >
                {slot} {decidedName ? `✓` : ""}
              </button>
            );
          })}

          <span className="ml-auto text-xs text-neutral-400">
            Remaining today:{" "}
            <span
              className={
                remaining <= 0 ? "font-semibold text-red-400" : "font-semibold text-emerald-400"
              }
            >
              {Math.max(remaining, 0)}
            </span>
          </span>
        </div>

        {decidedMeals[selectedSlot] && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-center justify-between">
            <span>
              Current pick for <strong className="uppercase">{selectedSlot}</strong>: <strong>{decidedMeals[selectedSlot]}</strong>
            </span>
            <Link href="/home" className="underline hover:text-emerald-200">View on Home</Link>
          </div>
        )}

        {successMsg && (
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-200">
            🎉 {successMsg}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-neutral-400">Loading meals…</p>
      ) : !currentMeal ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-center space-y-3">
          <p className="text-neutral-300 text-sm">
            No more meals to swipe right now for <strong className="uppercase">{selectedSlot}</strong>.
          </p>
          <Link
            href="/home"
            className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Go to Home to view your plan
          </Link>
        </div>
      ) : (
        <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900/70 p-5 shadow-lg space-y-3">
          <div className="text-xs text-neutral-400 font-medium">
            Swiping for: <span className="uppercase text-emerald-400 font-bold">{selectedSlot}</span>
          </div>

          {currentMeal.image_url && (
            <div className="overflow-hidden rounded-lg bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentMeal.image_url}
                alt={currentMeal.title}
                className="h-52 w-full object-cover"
              />
            </div>
          )}
          <h2 className="text-lg font-semibold text-neutral-100">{currentMeal.title}</h2>
          {currentMeal.description && (
            <p className="text-sm text-neutral-300">
              {currentMeal.description}
            </p>
          )}
          {currentMeal.prep_time_minutes != null && (
            <p className="text-xs text-neutral-400">
              Prep time: {currentMeal.prep_time_minutes} min
            </p>
          )}

          <div className="pt-2 flex justify-between gap-2">
            <button
              type="button"
              className="flex-1 rounded-full border border-red-500/70 px-3 py-2 text-sm text-red-200 hover:border-red-400 hover:bg-red-500/10"
              onClick={() => void recordDecision("dislike")}
            >
              Dislike
            </button>
            <button
              type="button"
              className="flex-1 rounded-full border border-neutral-600 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-400 hover:bg-neutral-800"
              onClick={() => void recordDecision("skip")}
            >
              Skip
            </button>
            <button
              type="button"
              disabled={!canSwipe}
              className="flex-1 rounded-full border border-emerald-400 bg-emerald-400/20 px-3 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-300 hover:bg-emerald-400/30 disabled:opacity-50"
              onClick={() => void recordDecision("like")}
            >
              {remaining > 0 ? `Like for ${selectedSlot.toUpperCase()}` : "Limit reached"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SwipePage() {
  return (
    <Suspense fallback={<p className="text-neutral-400">Loading swipe page…</p>}>
      <SwipeContent />
    </Suspense>
  );
}



