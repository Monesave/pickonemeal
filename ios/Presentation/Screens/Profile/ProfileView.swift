import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @State private var stats: ProfileStatsViewModel?
    @State private var isLoading = false
    @State private var notificationSettings: NotificationSettings?
    @State private var isSavingNotifications = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.96, green: 0.95, blue: 0.98)
                    .ignoresSafeArea()

                if isLoading {
                    ProgressView("Loading your stats…")
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            Text("Profile & settings")
                                .font(.title2.bold())

                            if let stats {
                                ProfileHeaderCard(stats: stats, email: authViewModel.session?.user.email)

                                VStack(spacing: 16) {
                                    ProfilePointsCard(points: stats.gamificationPointsYear)
                                    ProfileSocialCard(stats: stats)
                                    if let notificationSettings {
                                        NotificationSettingsCard(
                                            settings: notificationSettings,
                                            isSaving: isSavingNotifications,
                                            onChange: { newSettings in
                                                Task {
                                                    await saveNotificationSettings(newSettings)
                                                }
                                            }
                                        )
                                    }
                                }
                            } else {
                                Text("Dietary preferences, cuisines, and account settings will live here.")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }

                            Button {
                                Task {
                                    await authViewModel.signOut()
                                }
                            } label: {
                                Text("Sign out")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        .padding(20)
                    }
                }
            }
            .navigationTitle("Profile")
            .task {
                await loadStats()
                await loadNotificationSettings()
            }
        }
    }

    private func loadStats() async {
        guard let userId = authViewModel.session?.user.id.uuidString else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            let client = SupabaseClientProvider.shared.client
            struct Row: Decodable {
                let display_name: String?
                let followers_count: Int
                let following_count: Int
                let gamification_points_year: Int
                let is_leading_chef: Bool
                let chef_status: String
            }

            let response = try await client
                .from("profiles")
                .select("display_name, followers_count, following_count, gamification_points_year, is_leading_chef, chef_status")
                .eq(column: "id", value: userId)
                .maybeSingle()

            if let response {
                let row = try response.decoded(to: Row.self)
                stats = ProfileStatsViewModel(
                    displayName: row.display_name,
                    followersCount: row.followers_count,
                    followingCount: row.following_count,
                    gamificationPointsYear: row.gamification_points_year,
                    isLeadingChef: row.is_leading_chef,
                    chefStatus: row.chef_status
                )
            }
        } catch {
            print("Failed to load profile stats:", error)
        }
    }

    private func loadNotificationSettings() async {
        guard let userId = authViewModel.session?.user.id.uuidString else { return }
        do {
            let repo = NotificationSettingsRepository()
            notificationSettings = try await repo.fetchSettings(for: userId)

            if let token = UserDefaults.standard.string(forKey: "apnsDeviceToken") {
                try await repo.updateApnsToken(for: userId, token: token)
            }
        } catch {
            print("Failed to load notification settings:", error)
        }
    }

    private func saveNotificationSettings(_ newSettings: NotificationSettings) async {
        guard let userId = authViewModel.session?.user.id.uuidString else { return }
        isSavingNotifications = true
        defer { isSavingNotifications = false }

        do {
            let repo = NotificationSettingsRepository()
            try await repo.upsertSettings(
                for: userId,
                leadingChefPicksEnabled: newSettings.leadingChefPicksEnabled,
                tableWinnerEnabled: newSettings.tableWinnerEnabled
            )
            notificationSettings = newSettings
        } catch {
            print("Failed to save notification settings:", error)
        }
    }
}

struct ProfileStatsViewModel {
    let displayName: String?
    let followersCount: Int
    let followingCount: Int
    let gamificationPointsYear: Int
    let isLeadingChef: Bool
    let chefStatus: String
}

private struct ProfileHeaderCard: View {
    let stats: ProfileStatsViewModel
    let email: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(stats.displayName ?? (email ?? "Unknown user"))
                .font(.headline)
            if let email {
                Text(email)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.04), radius: 10, y: 5)
        )
    }
}

private struct NotificationSettingsCard: View {
    @State var settings: NotificationSettings
    let isSaving: Bool
    let onChange: (NotificationSettings) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Notifications")
                    .font(.subheadline.bold())
                if isSaving {
                    ProgressView()
                        .scaleEffect(0.6)
                }
            }

            Toggle("Leading Chef picks meals I follow", isOn: Binding(
                get: { settings.leadingChefPicksEnabled },
                set: { newValue in
                    settings.leadingChefPicksEnabled = newValue
                    onChange(settings)
                }
            ))
            .font(.caption)

            Toggle("Dining table I’m in has a winner", isOn: Binding(
                get: { settings.tableWinnerEnabled },
                set: { newValue in
                    settings.tableWinnerEnabled = newValue
                    onChange(settings)
                }
            ))
            .font(.caption)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.04), radius: 10, y: 5)
        )
    }
}

private struct ProfilePointsCard: View {
    let points: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("My Points (Gamification)")
                .font(.subheadline.bold())
            Text("This year: \(points) points")
                .font(.caption)
                .foregroundColor(.secondary)
            NavigationLink("View my detailed stats") {
                StatsView()
            }
            .font(.caption)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.04), radius: 10, y: 5)
        )
    }
}

private struct ProfileSocialCard: View {
    let stats: ProfileStatsViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Social")
                .font(.subheadline.bold())
            Text("Followers: \(stats.followersCount) • Following: \(stats.followingCount)")
                .font(.caption)
                .foregroundColor(.secondary)
            if stats.isLeadingChef, stats.chefStatus == "active" {
                Text("⭐ Leading Chef")
                    .font(.caption)
                    .foregroundColor(.yellow)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.04), radius: 10, y: 5)
        )
    }
}


