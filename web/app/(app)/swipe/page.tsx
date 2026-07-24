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
    <div className="space-y-6">
      <header className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Swipe & Plan Meals</h1>
          <Link
            href="/home"
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
        <p className="text-sm text-slate-400 font-medium">
          Select a meal slot below and swipe meals to set your daily plan. You can pick up to{" "}
          <span className="font-bold text-rose-500">{DAILY_LIMIT}</span> meals per day.
        </p>
      </header>

      {/* Slot Selector Tabs */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Target slot:</span>
          {SLOTS.map((slot) => {
            const decidedName = decidedMeals[slot];
            const isSelected = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                className={`rounded-full border px-3.5 py-1.5 capitalize transition-all duration-200 ${
                  isSelected
                    ? "border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50 font-bold text-rose-600 shadow-sm"
                    : "border-slate-200 bg-white/60 backdrop-blur-sm text-slate-500 hover:border-slate-300 hover:text-slate-700"
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

          <span className="ml-auto text-xs text-slate-400 font-medium">
            Remaining today:{" "}
            <span
              className={
                remaining <= 0 ? "font-bold text-red-500" : "font-bold text-emerald-600"
              }
            >
              {Math.max(remaining, 0)}
            </span>
          </span>
        </div>

        {decidedMeals[selectedSlot] && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 font-medium flex items-center justify-between">
            <span>
              Current pick for <strong className="uppercase">{selectedSlot}</strong>: <strong>{decidedMeals[selectedSlot]}</strong>
            </span>
            <Link href="/home" className="underline hover:text-emerald-900 font-semibold">View on Home</Link>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
            🎉 {successMsg}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="max-w-md h-72 rounded-2xl bg-white/40 backdrop-blur-sm animate-pulse shadow-sm" />
      ) : !currentMeal ? (
        <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-8 text-center space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-slate-100 to-purple-50 flex items-center justify-center text-2xl">🍽️</div>
          <p className="text-slate-500 text-sm font-medium">
            No more meals to swipe right now for <strong className="uppercase text-slate-700">{selectedSlot}</strong>.
          </p>
          <Link
            href="/home"
            className="inline-block rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow-md hover:brightness-110 transition-all duration-200"
          >
            Go to Home to view your plan
          </Link>
        </div>
      ) : (
        <div className="max-w-md rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-3.5">
          <div className="text-xs text-slate-400 font-semibold">
            Swiping for: <span className="uppercase text-rose-500 font-bold">{selectedSlot}</span>
          </div>

          {currentMeal.image_url && (
            <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-purple-50 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentMeal.image_url}
                alt={currentMeal.title}
                className="h-52 w-full object-cover"
              />
            </div>
          )}
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
              className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-100 hover:border-red-300 active:scale-[0.97]"
              onClick={() => void recordDecision("dislike")}
            >
              Dislike
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-white hover:border-slate-300 hover:text-slate-700 active:scale-[0.97]"
              onClick={() => void recordDecision("skip")}
            >
              Skip
            </button>
            <button
              type="button"
              disabled={!canSwipe}
              className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
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
    <Suspense fallback={<div className="h-56 rounded-2xl bg-white/40 backdrop-blur-sm animate-pulse shadow-sm" />}>
      <SwipeContent />
    </Suspense>
  );
}



