"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type MealSlot = "breakfast" | "lunch" | "dinner";

type SlotSummary = {
  slot: MealSlot;
  status: "decided" | "skipped" | "none";
  mealTitle?: string | null;
  description?: string | null;
  prepTimeMinutes?: number | null;
  imageUrl?: string | null;
};

export default function HomePage() {
  const { session } = useAuth();
  const [slots, setSlots] = useState<SlotSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Meal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetSlot, setTargetSlot] = useState<MealSlot>("breakfast");
  const [mealTitle, setMealTitle] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!session) return;
    setLoading(true);
    const today = new Date();
    const isoDate = format(today, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("user_daily_plans")
      .select("meal_slot, status, meals(title, description, prep_time_minutes, image_url)")
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
      const meal = Array.isArray(row.meals) ? row.meals[0] : row.meals;
      return {
        slot: s.slot,
        status: row.status,
        mealTitle: meal?.title ?? null,
        description: meal?.description ?? null,
        prepTimeMinutes: meal?.prep_time_minutes ?? null,
        imageUrl: meal?.image_url ?? null
      };
    });

    setSlots(enriched);
    setLoading(false);
  };

  useEffect(() => {
    void fetchSummary();
  }, [session]);

  const handleCreateMeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!mealTitle.trim()) {
      setCreateError("Meal title is required.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    let { data, error } = await supabase
      .from("meals")
      .insert({
        title: mealTitle.trim(),
        description: mealDescription.trim() || null,
        prep_time_minutes: prepTime ? parseInt(prepTime, 10) : null,
        image_url: imageUrl.trim() || null,
        is_active: true
      })
      .select("id, title")
      .single();

    if (error && error.code === "42501") {
      // Fallback to RPC if direct insert fails RLS
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_meal", {
        p_title: mealTitle.trim(),
        p_description: mealDescription.trim() || null,
        p_prep_time_minutes: prepTime ? parseInt(prepTime, 10) : null,
        p_image_url: imageUrl.trim() || null
      });

      if (!rpcError && rpcData) {
        data = rpcData;
        error = null;
      } else if (rpcError) {
        error = rpcError;
      }
    }

    if (error) {
      setCreating(false);
      console.error("Failed to create meal", error);
      setCreateError(
        error.code === "42501"
          ? "Permission denied (RLS policy). Please run the provided SQL in Supabase SQL editor to allow meal creation."
          : error.message || "Failed to create meal."
      );
      return;
    }

    if (data) {
      // Assign created meal to selected slot for today in user_daily_plans
      const isoDate = format(new Date(), "yyyy-MM-dd");
      const { error: planError } = await supabase.from("user_daily_plans").upsert(
        {
          user_id: session.user.id,
          date: isoDate,
          meal_slot: targetSlot,
          status: "decided",
          meal_id: data.id
        },
        { onConflict: "user_id,date,meal_slot" }
      );

      if (planError) {
        console.error("Failed to assign meal to daily plan", planError);
      }

      setCreating(false);
      setCreateSuccess(`Meal "${data.title}" created & assigned to ${targetSlot.toUpperCase()}!`);
      setMealTitle("");
      setMealDescription("");
      setPrepTime("");
      setImageUrl("");

      // Immediately refresh the Home page columns
      await fetchSummary();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1.5 text-3xl font-bold text-slate-800">Today&apos;s meals</h1>
        <p className="text-sm text-slate-400 font-medium">
          Overview of your Breakfast, Lunch, and Dinner plan for today.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-white/40 backdrop-blur-sm animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.slot}
              className="group flex flex-col justify-between rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-400 to-rose-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                    {slot.slot}
                  </span>
                  <span className={`text-[10px] rounded-full px-2.5 py-1 font-semibold ${
                    slot.status === "decided"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : slot.status === "skipped"
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                    {slot.status === "decided" ? "✓ Decided" : slot.status === "skipped" ? "Skipped" : "Empty"}
                  </span>
                </div>

                {slot.status === "decided" && slot.mealTitle ? (
                  <div className="space-y-2">
                    {slot.imageUrl && (
                      <div className="h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-purple-50 mb-3 shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.imageUrl}
                          alt={slot.mealTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-base font-bold text-slate-800">{slot.mealTitle}</h3>
                    {slot.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{slot.description}</p>
                    )}
                    {slot.prepTimeMinutes != null && (
                      <p className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 rounded-full px-2.5 py-0.5 border border-slate-100 font-medium">⏱️ Prep: {slot.prepTimeMinutes} min</p>
                    )}
                  </div>
                ) : slot.status === "skipped" ? (
                  <div className="py-6 text-center text-sm text-slate-400 font-medium">
                    Skipped for today
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-purple-50 flex items-center justify-center text-lg">🍽️</div>
                    <p className="text-sm text-slate-400 font-medium">Not chosen yet.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex gap-2">
                <Link
                  href={`/swipe?slot=${slot.slot}`}
                  className="flex-1 rounded-xl bg-white/80 border border-slate-200 py-2 text-center text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md hover:text-slate-800"
                >
                  {slot.status === "decided" ? "Change" : "Swipe to pick"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setTargetSlot(slot.slot);
                    setShowCreateModal(true);
                    setCreateSuccess(null);
                    setCreateError(null);
                  }}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.97]"
                  title={`Create meal for ${slot.slot}`}
                >
                  + Create
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3.5">
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Quick actions</h2>
        <div className="flex flex-wrap gap-2.5 text-sm">
          <Link
            href="/swipe"
            className="rounded-full bg-white/60 backdrop-blur-sm border border-white/50 px-4 py-2 font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:bg-white/90 hover:shadow-md hover:text-slate-800"
          >
            🎯 Plan my meals
          </Link>
          <Link
            href="/tables"
            className="rounded-full bg-white/60 backdrop-blur-sm border border-white/50 px-4 py-2 font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:bg-white/90 hover:shadow-md hover:text-slate-800"
          >
            🍽️ Dining Tables
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setCreateSuccess(null);
              setCreateError(null);
            }}
            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.97]"
          >
            + Create Meal
          </button>
        </div>
      </div>

      {/* Create Meal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-lg font-bold text-slate-800">Create New Meal</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors text-sm font-medium"
              >
                ✕
              </button>
            </div>

            {createSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 font-medium">
                {createSuccess}
              </div>
            )}

            {createError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateMeal} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Assign to Meal Slot <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTargetSlot(s)}
                      className={`rounded-xl border py-2.5 text-xs font-semibold capitalize transition-all duration-200 ${
                        targetSlot === s
                          ? "border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50 text-rose-600 shadow-sm"
                          : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Meal Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avocado Toast with Eggs"
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-800 placeholder-slate-300 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description or key ingredients..."
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-800 placeholder-slate-300 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="e.g. 15"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-800 placeholder-slate-300 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-800 placeholder-slate-300 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Saving..." : `Save & Assign to ${targetSlot.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



