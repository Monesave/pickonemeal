"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type TableStatus = "not_started" | "active" | "completed" | "archived";
type MealSlot = "breakfast" | "lunch" | "dinner";

type TableRow = {
  id: string;
  name: string;
  date: string;
  meal_slot: MealSlot;
  status: TableStatus;
  is_owner: boolean;
};

const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

export default function TablesPage() {
  const { session } = useAuth();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [mealSlot, setMealSlot] = useState<MealSlot>("dinner");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const fetchTables = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("dining_table_participants")
        .select(
          `
          table_id:table_id,
          role,
          dining_tables!inner (
            id,
            name,
            date,
            meal_slot,
            status,
            owner_id
          )
        `
        )
        .eq("user_id", session.user.id)
        .order("date", { referencedTable: "dining_tables", ascending: false });

      if (fetchError) {
        console.error(fetchError);
        setError("Failed to load tables.");
        setLoading(false);
        return;
      }

      const mapped: TableRow[] =
        data?.map((row: any) => ({
          id: row.dining_tables.id,
          name: row.dining_tables.name,
          date: row.dining_tables.date,
          meal_slot: row.dining_tables.meal_slot,
          status: row.dining_tables.status,
          is_owner: row.dining_tables.owner_id === session.user.id
        })) ?? [];

      setTables(mapped);
      setLoading(false);
    };

    void fetchTables();
  }, [session]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setCreating(true);
    setCreateError(null);

    try {
      const { data, error } = await supabase.rpc("create_dining_table", {
        p_name: name,
        p_date: date,
        p_meal_slot: mealSlot
      });

      if (error || !data) {
        console.error(error);
        const message =
          error?.message?.includes("Subscription required") ??
          false
            ? "You need an active subscription to create Dining Tables."
            : "Unable to create table.";
        setCreateError(message);
        return;
      }

      const table = data as any;
      setTables((prev) => [
        {
          id: table.id,
          name: table.name,
          date: table.date,
          meal_slot: table.meal_slot,
          status: table.status,
          is_owner: true
        },
        ...prev
      ]);
      setName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-7">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-800">Dining Tables</h1>
        <p className="text-sm text-slate-400 font-medium">
          See tables you&apos;ve created or joined and start group meal votes.
        </p>
      </header>

      <section className="space-y-3.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <h2 className="text-sm font-bold text-slate-700">Create table</h2>
        <p className="text-xs text-slate-400 font-medium">
          As a Dining Table owner (subscriber), you can create a table and share
          an invite link with your family or friends.
        </p>
        <form
          onSubmit={handleCreate}
          className="mt-2 grid gap-3 text-sm sm:grid-cols-[2fr,auto,auto,auto]"
        >
          <input
            type="text"
            required
            placeholder="e.g. Friday Family Dinner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-800 placeholder-slate-300 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
          />
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
          />
          <select
            value={mealSlot}
            onChange={(e) => setMealSlot(e.target.value as MealSlot)}
            className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 capitalize transition-all duration-200"
          >
            {MEAL_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot.charAt(0).toUpperCase() + slot.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {creating ? "Creating..." : "Create table"}
          </button>
        </form>
        {createError && (
          <p className="text-xs text-red-500 font-medium" role="alert">
            {createError}
          </p>
        )}
        <p className="text-[11px] text-slate-400">
          Creating tables requires an active creator subscription; this is
          enforced by the backend.
        </p>
      </section>

      <section className="space-y-3.5">
        <h2 className="text-sm font-bold text-slate-700">
          Your tables
        </h2>
        {error && (
          <p className="text-xs text-red-500 font-medium" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/40 backdrop-blur-sm animate-pulse shadow-sm" />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/50 p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-purple-50 flex items-center justify-center text-lg">🍽️</div>
            <p className="text-sm text-slate-400 font-medium">
              You haven&apos;t joined or created any Dining Tables yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tables.map((table) => (
              <div
                key={table.id}
                className="flex items-center justify-between rounded-xl bg-white/60 backdrop-blur-xl border border-white/50 px-4 py-3 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:-translate-y-px"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    {table.name}
                    {table.is_owner && (
                      <span className="ml-2 rounded-full bg-pink-50 border border-pink-200 px-2 py-[1px] text-[10px] font-bold uppercase tracking-wide text-rose-500">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {table.date} • <span className="capitalize">{table.meal_slot}</span> • <span className="capitalize">{table.status.replace("_", " ")}</span>
                  </div>
                </div>
                <Link
                  href={`/tables/${table.id}`}
                  className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow-md"
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



