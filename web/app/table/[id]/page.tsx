"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export default function JoinTablePage() {
  const params = useParams<{ id: string }>();
  const tableId = params?.id;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { session } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "joining" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId || !token) {
      setError("Invalid invite link.");
      return;
    }
    if (!session) {
      // Require user to log in; they can re-open the link after.
      router.replace("/app/onboarding");
      return;
    }

    const join = async () => {
      setStatus("joining");
      setError(null);

      // Validate table + token
      const { data: tableRow, error: tableError } = await supabase
        .from("dining_tables")
        .select("id, invite_token")
        .eq("id", tableId)
        .eq("invite_token", token)
        .maybeSingle();

      if (tableError || !tableRow) {
        setError("This invite link is invalid or has expired.");
        setStatus("idle");
        return;
      }

      // Upsert participant record
      const { error: participantError } = await supabase
        .from("dining_table_participants")
        .upsert({
          table_id: tableId,
          user_id: session.user.id,
          role: "member"
        });

      if (participantError) {
        console.error(participantError);
        setError("Failed to join this Dining Table.");
        setStatus("idle");
        return;
      }

      setStatus("done");
      router.replace(`/app/tables/${tableId}`);
    };

    void join();
  }, [session, tableId, token, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-neutral-300">
        {status === "joining"
          ? "Joining Dining Table…"
          : "Preparing to join Dining Table…"}
      </p>
    </div>
  );
}


