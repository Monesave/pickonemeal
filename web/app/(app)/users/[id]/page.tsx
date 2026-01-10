"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type PublicProfile = {
  id: string;
  display_name: string | null;
  followers_count: number;
  following_count: number;
  gamification_points_year: number;
  is_leading_chef: boolean;
  chef_status: string;
};

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const viewedUserId = params?.id;
  const { session } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewedUserId || !session) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const [{ data: profileRow, error: profileError }, { data: followRows }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, display_name, followers_count, following_count, gamification_points_year, is_leading_chef, chef_status"
            )
            .eq("id", viewedUserId)
            .maybeSingle(),
          supabase
            .from("user_follows")
            .select("id")
            .eq("follower_id", session.user.id)
            .eq("followed_id", viewedUserId)
        ]);

      if (profileError || !profileRow) {
        console.error(profileError);
        setError("Unable to load user profile.");
        setLoading(false);
        return;
      }

      setProfile(profileRow as PublicProfile);
      setIsFollowing((followRows ?? []).length > 0);
      setLoading(false);
    };

    void load();
  }, [session, viewedUserId]);

  const canFollow =
    session && viewedUserId && session.user.id !== viewedUserId;

  const handleFollowToggle = async () => {
    if (!session || !viewedUserId || isFollowing == null) return;
    setActionLoading(true);
    setError(null);
    try {
      if (isFollowing) {
        const { error } = await supabase.rpc("unfollow_user", {
          p_followed_id: viewedUserId
        });
        if (error) {
          console.error(error);
          setError("Failed to unfollow user.");
        } else {
          setIsFollowing(false);
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  followers_count: Math.max(prev.followers_count - 1, 0)
                }
              : prev
          );
        }
      } else {
        const { error } = await supabase.rpc("follow_user", {
          p_followed_id: viewedUserId
        });
        if (error) {
          console.error(error);
          setError("Failed to follow user.");
        } else {
          setIsFollowing(true);
          setProfile((prev) =>
            prev
              ? { ...prev, followers_count: prev.followers_count + 1 }
              : prev
          );
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (!viewedUserId) {
    return (
      <p className="text-sm text-red-400" role="alert">
        Invalid user id.
      </p>
    );
  }

  if (!session) {
    return (
      <p className="text-sm text-neutral-300">
        Please sign in to view profiles.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-neutral-400">Loading user profile…</p>
      ) : error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : profile ? (
        <>
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold">
              {profile.display_name ?? "User"}
            </h1>
            <p className="text-sm text-neutral-400">
              Followers: {profile.followers_count} • Following:{" "}
              {profile.following_count}
            </p>
            {profile.is_leading_chef && profile.chef_status === "active" && (
              <p className="text-xs text-amber-300">⭐ Leading Chef</p>
            )}
            {canFollow && (
              <button
                type="button"
                disabled={actionLoading || isFollowing == null}
                onClick={() => void handleFollowToggle()}
                className="mt-2 rounded border border-neutral-600 px-3 py-1 text-xs font-medium text-neutral-100 hover:border-neutral-300 disabled:opacity-50"
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </header>

          <section className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-100">
              Gamification
            </h2>
            <p className="text-sm text-neutral-300">
              This year:{" "}
              <span className="font-semibold">
                {profile.gamification_points_year}
              </span>{" "}
              points
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}


