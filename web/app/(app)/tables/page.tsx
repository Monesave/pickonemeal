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
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dining Tables</h1>
        <p className="text-sm text-neutral-300">
          See tables you&apos;ve created or joined and start group meal votes.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
        <h2 className="text-sm font-semibold text-neutral-100">Create table</h2>
        <p className="text-xs text-neutral-400">
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
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-50 outline-none focus:border-neutral-300"
          />
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-50 outline-none focus:border-neutral-300"
          />
          <select
            value={mealSlot}
            onChange={(e) => setMealSlot(e.target.value as MealSlot)}
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-50 outline-none focus:border-neutral-300 capitalize"
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
            className="rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create table"}
          </button>
        </form>
        {createError && (
          <p className="text-xs text-red-400" role="alert">
            {createError}
          </p>
        )}
        <p className="text-[11px] text-neutral-500">
          Creating tables requires an active creator subscription; this is
          enforced by the backend.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-100">
          Your tables
        </h2>
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-neutral-400">Loading tables…</p>
        ) : tables.length === 0 ? (
          <p className="text-sm text-neutral-400">
            You haven&apos;t joined or created any Dining Tables yet.
          </p>
        ) : (
          <div className="space-y-2">
            {tables.map((table) => (
              <div
                key={table.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-neutral-100">
                    {table.name}
                    {table.is_owner && (
                      <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-[1px] text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {table.date} • <span className="capitalize">{table.meal_slot}</span> • {table.status}
                  </div>
                </div>
                <Link
                  href={`/tables/${table.id}`}
                  className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:border-neutral-400"
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



