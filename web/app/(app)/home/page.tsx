"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type MealSlot = "breakfast" | "lunch" | "dinner";

type SlotSummary = {
  slot: MealSlot;
  status: "decided" | "skipped" | "none";
  mealTitle?: string | null;
};

export default function HomePage() {
  const { session } = useAuth();
  const [slots, setSlots] = useState<SlotSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchSummary = async () => {
      setLoading(true);
      const today = new Date();
      const isoDate = format(today, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("user_daily_plans")
        .select("meal_slot, status, meals(title)")
        .eq("user_id", session.user.id)
        .eq("date", isoDate);

      if (error) {
        console.error("Failed to load daily plans", error);
        setLoading(false);
        return;
      }

      const baseSlots: SlotSummary[] = [
        { slot: "breakfast", status: "none" },
        { slot: "lunch", status: "none" },
        { slot: "dinner", status: "none" }
      ];

      const enriched = baseSlots.map((s) => {
        const row = data?.find((d: any) => d.meal_slot === s.slot);
        if (!row) return s;
        return {
          slot: s.slot,
          status: row.status,
          mealTitle: Array.isArray(row.meals) 
            ? row.meals[0]?.title ?? null 
            : (row.meals as any)?.title ?? null
        };
      });

      setSlots(enriched);
      setLoading(false);
    };

    void fetchSummary();
  }, [session]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Today&apos;s meals</h1>
        <p className="text-sm text-neutral-300">
          Overview of your Breakfast, Lunch, and Dinner plan for today.
        </p>
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading your plan…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.slot}
              className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-3"
            >
              <div className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
                {slot.slot}
              </div>
              {slot.status === "decided" && slot.mealTitle ? (
                <>
                  <div className="text-sm font-medium">{slot.mealTitle}</div>
                  <div className="text-xs text-neutral-400">Decided</div>
                </>
              ) : slot.status === "skipped" ? (
                <div className="text-sm text-neutral-400">Skipped</div>
              ) : (
                <div className="text-sm text-neutral-400">
                  Not chosen yet. Swipe to pick a meal.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-200">Quick actions</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href="/app/swipe"
            className="rounded-full border border-neutral-700 px-3 py-1 hover:border-neutral-400"
          >
            Plan my meals
          </a>
          <a
            href="/app/tables"
            className="rounded-full border border-neutral-700 px-3 py-1 hover:border-neutral-400"
          >
            Dining Tables
          </a>
        </div>
      </div>
    </div>
  );
}



