"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type MealSlot = "breakfast" | "lunch" | "dinner";

type SlotSummary = {
  slot: MealSlot;"use client";

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
        <div className="grid gap-4 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.slot}
              className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {slot.slot}
                  </span>
                  <span className="text-[10px] rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-400 font-medium">
                    {slot.status === "decided" ? "Decided" : slot.status === "skipped" ? "Skipped" : "Empty"}
                  </span>
                </div>

                {slot.status === "decided" && slot.mealTitle ? (
                  <div className="space-y-1.5">
                    {slot.imageUrl && (
                      <div className="h-28 w-full overflow-hidden rounded-md bg-neutral-800 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.imageUrl}
                          alt={slot.mealTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-base font-semibold text-neutral-100">{slot.mealTitle}</h3>
                    {slot.description && (
                      <p className="text-xs text-neutral-300 line-clamp-2">{slot.description}</p>
                    )}
                    {slot.prepTimeMinutes != null && (
                      <p className="text-[11px] text-neutral-400">⏱️ Prep: {slot.prepTimeMinutes} min</p>
                    )}
                  </div>
                ) : slot.status === "skipped" ? (
                  <div className="py-4 text-center text-sm text-neutral-400">
                    Skipped for today
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-neutral-400">
                    Not chosen yet.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex gap-2">
                <Link
                  href={`/swipe?slot=${slot.slot}`}
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 py-1.5 text-center text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800"
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
                  className="rounded-lg border border-emerald-600/60 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                  title={`Create meal for ${slot.slot}`}
                >
                  + Create
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-200">Quick actions</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/swipe"
            className="rounded-full border border-neutral-700 px-3.5 py-1.5 hover:border-neutral-400"
          >
            Plan my meals
          </Link>
          <Link
            href="/tables"
            className="rounded-full border border-neutral-700 px-3.5 py-1.5 hover:border-neutral-400"
          >
            Dining Tables
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setCreateSuccess(null);
              setCreateError(null);
            }}
            className="rounded-full border border-emerald-600 bg-emerald-500/10 px-3.5 py-1.5 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            + Create Meal
          </button>
        </div>
      </div>

      {/* Create Meal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-semibold text-neutral-100">Create New Meal</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>

            {createSuccess && (
              <div className="rounded border border-emerald-500/50 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
                {createSuccess}
              </div>
            )}

            {createError && (
              <div className="rounded border border-red-500/50 bg-red-500/10 p-2.5 text-xs text-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateMeal} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Assign to Meal Slot <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTargetSlot(s)}
                      className={`rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${
                        targetSlot === s
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                          : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Meal Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avocado Toast with Eggs"
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description or key ingredients..."
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="e.g. 15"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-neutral-700 px-4 py-2 text-xs text-neutral-300 hover:border-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
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
        <div className="grid gap-4 sm:grid-cols-3">
          {slots.map((slot) => (
            <div
              key={slot.slot}
              className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {slot.slot}
                  </span>
                  <span className="text-[10px] rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-400 font-medium">
                    {slot.status === "decided" ? "Decided" : slot.status === "skipped" ? "Skipped" : "Empty"}
                  </span>
                </div>

                {slot.status === "decided" && slot.mealTitle ? (
                  <div className="space-y-1.5">
                    {slot.imageUrl && (
                      <div className="h-28 w-full overflow-hidden rounded-md bg-neutral-800 mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.imageUrl}
                          alt={slot.mealTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-base font-semibold text-neutral-100">{slot.mealTitle}</h3>
                    {slot.description && (
                      <p className="text-xs text-neutral-300 line-clamp-2">{slot.description}</p>
                    )}
                    {slot.prepTimeMinutes != null && (
                      <p className="text-[11px] text-neutral-400">⏱️ Prep: {slot.prepTimeMinutes} min</p>
                    )}
                  </div>
                ) : slot.status === "skipped" ? (
                  <div className="py-4 text-center text-sm text-neutral-400">
                    Skipped for today
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-neutral-400">
                    Not chosen yet.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex gap-2">
                <Link
                  href={`/swipe?slot=${slot.slot}`}
                  className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 py-1.5 text-center text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800"
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
                  className="rounded-lg border border-emerald-600/60 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                  title={`Create meal for ${slot.slot}`}
                >
                  + Create
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-200">Quick actions</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/swipe"
            className="rounded-full border border-neutral-700 px-3.5 py-1.5 hover:border-neutral-400"
          >
            Plan my meals
          </Link>
          <Link
            href="/tables"
            className="rounded-full border border-neutral-700 px-3.5 py-1.5 hover:border-neutral-400"
          >
            Dining Tables
          </Link>
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setCreateSuccess(null);
              setCreateError(null);
            }}
            className="rounded-full border border-emerald-600 bg-emerald-500/10 px-3.5 py-1.5 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            + Create Meal
          </button>
        </div>
      </div>

      {/* Create Meal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-semibold text-neutral-100">Create New Meal</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>

            {createSuccess && (
              <div className="rounded border border-emerald-500/50 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
                {createSuccess}
              </div>
            )}

            {createError && (
              <div className="rounded border border-red-500/50 bg-red-500/10 p-2.5 text-xs text-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateMeal} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Assign to Meal Slot <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTargetSlot(s)}
                      className={`rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${
                        targetSlot === s
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                          : "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Meal Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avocado Toast with Eggs"
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description or key ingredients..."
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="e.g. 15"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-neutral-700 px-4 py-2 text-xs text-neutral-300 hover:border-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
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



