import SwiftUI

struct PublicProfileView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    let userId: String

    @State private var stats: ProfileStatsViewModel?
    @State private var isFollowing: Bool = false
    @State private var loading = false
    @State private var actionLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.96, green: 0.95, blue: 0.98)
                    .ignoresSafeArea()

                if loading {
                    ProgressView("Loading user…")
                } else if let stats {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(stats.displayName ?? "User")
                                    .font(.title2.bold())
                                if stats.isLeadingChef, stats.chefStatus == "active" {
                                    Text("⭐ Leading Chef")
                                        .font(.caption)
                                        .foregroundColor(.yellow)
                                }
                            }

                            VStack(spacing: 16) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Social")
                                        .font(.subheadline.bold())
                                    Text("Followers: \(stats.followersCount) • Following: \(stats.followingCount)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(
                                    RoundedRectangle(cornerRadius: 20)
                                        .fill(Color.white)
                                        .shadow(color: Color.black.opacity(0.04), radius: 10, y: 5)
                                )

                                VStack(alignment: .leading, spacing: 6) {
                                    Text("This year")
                                        .font(.subheadline.bold())
                                    Text("\(stats.gamificationPointsYear) points")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(
                                    RoundedRectangle(cornerRadius: 20)
                                        .fill(Color.white)
                                        .shadow(color: Color.black.opacity(0.04), radius: 10, y: 5)
                                )
                            }

                            if canFollow {
                                Button {
                                    Task { await toggleFollow() }
                                } label: {
                                    Text(isFollowing ? "Unfollow" : "Follow")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)
                                .disabled(actionLoading)
                            }

                            if let errorMessage {
                                Text(errorMessage)
                                    .font(.footnote)
                                    .foregroundColor(.red)
                            }
                        }
                        .padding(20)
                    }
                } else {
                    Text("Unable to load user profile.")
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("User")
            .task {
                await loadProfile()
            }
        }
    }

    private var canFollow: Bool {
        guard let currentId = authViewModel.session?.user.id.uuidString else { return false }
        return currentId != userId
    }

    private func loadProfile() async {
        guard authViewModel.session != nil else { return }
        loading = true
        errorMessage = nil

        do {
            let client = SupabaseClientProvider.shared.client

            struct Row: Decodable {
                let id: String
                let display_name: String?
                let followers_count: Int
                let following_count: Int
                let gamification_points_year: Int
                let is_leading_chef: Bool
                let chef_status: String
            }

            struct FollowRow: Decodable { let id: String }

            async let profileResponse = client
                .from("profiles")
                .select("id,display_name,followers_count,following_count,gamification_points_year,is_leading_chef,chef_status")
                .eq(column: "id", value: userId)
                .maybeSingle()

            let followerId = authViewModel.session?.user.id.uuidString ?? ""

            async let followResponse = client
                .from("user_follows")
                .select("id")
                .eq(column: "follower_id", value: followerId)
                .eq(column: "followed_id", value: userId)
                .execute()

            if let profileResp = try await profileResponse {
                let row = try profileResp.decoded(to: Row.self)
                stats = ProfileStatsViewModel(
                    displayName: row.display_name,
                    followersCount: row.followers_count,
                    followingCount: row.following_count,
                    gamificationPointsYear: row.gamification_points_year,
                    isLeadingChef: row.is_leading_chef,
                    chefStatus: row.chef_status
                )
            }

            let followRows = try await followResponse.decoded(to: [FollowRow].self)
            isFollowing = !followRows.isEmpty
        } catch {
            errorMessage = "Failed to load user."
            print("Failed to load public profile:", error)
        }

        loading = false
    }

    private func toggleFollow() async {
        guard canFollow else { return }
        actionLoading = true
        errorMessage = nil

        do {
            let client = SupabaseClientProvider.shared.client

            if isFollowing {
                _ = try await client
                    .rpc("unfollow_user", params: ["p_followed_id": userId])
                isFollowing = false
                if var current = stats {
                    current = ProfileStatsViewModel(
                        displayName: current.displayName,
                        followersCount: max(current.followersCount - 1, 0),
                        followingCount: current.followingCount,
                        gamificationPointsYear: current.gamificationPointsYear,
                        isLeadingChef: current.isLeadingChef,
                        chefStatus: current.chefStatus
                    )
                    stats = current
                }
            } else {
                _ = try await client
                    .rpc("follow_user", params: ["p_followed_id": userId])
                isFollowing = true
                if var current = stats {
                    current = ProfileStatsViewModel(
                        displayName: current.displayName,
                        followersCount: current.followersCount + 1,
                        followingCount: current.followingCount,
                        gamificationPointsYear: current.gamificationPointsYear,
                        isLeadingChef: current.isLeadingChef,
                        chefStatus: current.chefStatus
                    )
                    stats = current
                }
            }
        } catch {
            errorMessage = "Failed to update follow status."
            print("Failed to follow/unfollow:", error)
        }

        actionLoading = false
    }
}


