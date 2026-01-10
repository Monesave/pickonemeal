import SwiftUI

struct StatsView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @State private var rows: [GamificationRow] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                if isLoading {
                    ProgressView("Loading stats…")
                } else if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundColor(.red)
                } else if rows.isEmpty {
                    Text("You don't have any points yet this year.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                } else {
                    let totals = totalsFromRows(rows)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Summary")
                            .font(.subheadline.bold())
                        Text("Points: \(totals.points) • Meals won: \(totals.meals) • Participation rounds: \(totals.rounds)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    List(rows) { row in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(row.tableName ?? "All tables")
                                .font(.subheadline.bold())
                            Text("Points: \(row.totalPoints) • Meals won: \(row.mealsWon) • Rounds: \(row.participationRounds)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .listStyle(.insetGrouped)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("My Points")
            .task {
                await loadStats()
            }
        }
    }

    private func loadStats() async {
        guard let userId = authViewModel.session?.user.id.uuidString else { return }
        isLoading = true
        errorMessage = nil

        struct Row: Decodable, Identifiable {
            let table_id: String?
            let table_name: String?
            let season_year: Int
            let total_points: Int
            let meals_won: Int
            let participation_rounds: Int
            var id: String { (table_id ?? "global") + "_\(season_year)" }
        }

        let client = SupabaseClientProvider.shared.client
        let year = Calendar.current.component(.year, from: Date())

        do {
            let response = try await client
                .rpc("get_gamification_summary", params: [
                    "p_user_id": userId,
                    "p_season_year": year
                ])

            let decoded = try response.decoded(to: [Row].self)
            rows = decoded.map {
                GamificationRow(
                    id: $0.id,
                    tableId: $0.table_id,
                    tableName: $0.table_name,
                    seasonYear: $0.season_year,
                    totalPoints: $0.total_points,
                    mealsWon: $0.meals_won,
                    participationRounds: $0.participation_rounds
                )
            }
        } catch {
            errorMessage = "Failed to load stats."
            print("Failed to load stats:", error)
        }

        isLoading = false
    }

    private func totalsFromRows(_ rows: [GamificationRow]) -> (points: Int, meals: Int, rounds: Int) {
        rows.reduce((0, 0, 0)) { acc, row in
            (acc.0 + row.totalPoints, acc.1 + row.mealsWon, acc.2 + row.participationRounds)
        }
    }
}

struct GamificationRow: Identifiable {
    let id: String
    let tableId: String?
    let tableName: String?
    let seasonYear: Int
    let totalPoints: Int
    let mealsWon: Int
    let participationRounds: Int
}


