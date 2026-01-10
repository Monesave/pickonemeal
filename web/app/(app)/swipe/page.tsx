"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function SwipePage() {
  const { session } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>("dinner");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swipeCount, setSwipeCount] = useState<number>(0);

  const todayIso = useMemo(
    () => format(new Date(), "yyyy-MM-dd"),
    []
  );

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
        <h1 className="text-2xl font-semibold">Swipe meals</h1>
        <p className="text-sm text-neutral-300">
          Plan your solo meals for today. You can choose up to{" "}
          <span className="font-semibold">{DAILY_LIMIT}</span> meals per day.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-400">Meal slot:</span>
        {SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            className={`rounded-full border px-3 py-1 ${
              selectedSlot === slot
                ? "border-neutral-100 bg-neutral-100 text-neutral-900"
                : "border-neutral-700 text-neutral-200"
            }`}
            onClick={() => setSelectedSlot(slot)}
          >
            {slot}
          </button>
        ))}
        <span className="ml-auto text-xs text-neutral-400">
          Remaining today:{" "}
          <span
            className={
              remaining <= 0 ? "font-semibold text-red-400" : "font-semibold"
            }
          >
            {Math.max(remaining, 0)}
          </span>
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-neutral-400">Loading meals…</p>
      ) : !currentMeal ? (
        <p className="text-neutral-400">
          No more meals to show right now. Try again later.
        </p>
      ) : (
        <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          {currentMeal.image_url && (
            <div className="mb-3 overflow-hidden rounded-lg bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentMeal.image_url}
                alt={currentMeal.title}
                className="h-52 w-full object-cover"
              />
            </div>
          )}
          <h2 className="text-lg font-semibold">{currentMeal.title}</h2>
          {currentMeal.description && (
            <p className="mt-1 text-sm text-neutral-300">
              {currentMeal.description}
            </p>
          )}
          {currentMeal.prep_time_minutes != null && (
            <p className="mt-1 text-xs text-neutral-400">
              Prep time: {currentMeal.prep_time_minutes} min
            </p>
          )}

          <div className="mt-4 flex justify-between gap-2">
            <button
              type="button"
              className="flex-1 rounded-full border border-red-500/70 px-3 py-2 text-sm text-red-200 hover:border-red-400"
              onClick={() => void recordDecision("dislike")}
            >
              Dislike
            </button>
            <button
              type="button"
              className="flex-1 rounded-full border border-neutral-600 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-400"
              onClick={() => void recordDecision("skip")}
            >
              Skip
            </button>
            <button
              type="button"
              disabled={!canSwipe}
              className="flex-1 rounded-full border border-emerald-400 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200 hover:border-emerald-300 disabled:opacity-50"
              onClick={() => void recordDecision("like")}
            >
              {remaining > 0 ? "Like & plan" : "Limit reached"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



