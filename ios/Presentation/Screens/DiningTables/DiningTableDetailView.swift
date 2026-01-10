import SwiftUI

struct DiningTableDetailView: View {
    let tableId: String

    @EnvironmentObject private var authViewModel: AuthViewModel

    @State private var tableName: String = ""
    @State private var inviteURL: URL?
    @State private var rounds: [DiningTablesRepository.TableRound] = []
    @State private var isOwner: Bool = false
    @State private var isStartingRound: Bool = false
    @State private var startRoundError: String?

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text(tableName.isEmpty ? "Dining Table" : tableName)
                        .font(.title2.bold())

                    if let inviteURL {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Invite others")
                                .font(.subheadline.bold())
                            Text(inviteURL.absoluteString)
                                .font(.footnote)
                                .foregroundColor(.secondary)
                                .lineLimit(2)

                            if #available(iOS 16.0, *) {
                                ShareLink(
                                    "Share invite link",
                                    item: inviteURL
                                )
                            }
                        }
                    } else {
                        Text("Loading invite link…")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            if isOwner {
                Section(header: Text("Actions")) {
                    if let error = startRoundError {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    Button {
                        Task { await startRound() }
                    } label: {
                        if isStartingRound {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Start new round")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isStartingRound)
                }
            }

            Section(header: Text("Voting rounds")) {
                if rounds.isEmpty {
                    Text("No rounds yet. Start one from the web or mobile owner view.")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                } else {
                    ForEach(rounds) { round in
                        NavigationLink(
                            destination: RoundVotingView(
                                tableId: tableId,
                                roundId: round.id,
                                roundNumber: round.round_number
                            )
                        ) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Round \(round.round_number) • \(round.status.capitalized)")
                                    .font(.subheadline)
                                if let title = round.meals?.title {
                                    Text("Winner: \(title)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                } else {
                                    Text("No winner yet")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Dining Table")
        .task {
            await loadInviteAndRounds()
        }
    }

    private func loadInviteAndRounds() async {
        let client = SupabaseClientProvider.shared.client
        let repo = DiningTablesRepository()

        struct Row: Decodable {
            let name: String
            let invite_token: String
            let owner_id: String
        }

        do {
            async let inviteResponse = client
                .from("dining_tables")
                .select("name,invite_token,owner_id")
                .eq(column: "id", value: tableId)
                .single()

            async let roundsResponse = repo.fetchRounds(for: tableId)

            let inviteDecoded = try await inviteResponse.decoded(to: Row.self)
            let roundsDecoded = try await roundsResponse

            await MainActor.run {
                tableName = inviteDecoded.name
                if let url = URL(string: "https://pickonemeal.com/table/\(tableId)?token=\(inviteDecoded.invite_token)") {
                    inviteURL = url
                }
                rounds = roundsDecoded
                if let currentId = authViewModel.session?.user.id.uuidString {
                    isOwner = (inviteDecoded.owner_id == currentId)
                } else {
                    isOwner = false
                }
            }
        } catch {
            print("Failed to load table detail:", error)
        }
    }

    private func startRound() async {
        guard let userId = authViewModel.session?.user.id.uuidString else { return }
        isStartingRound = true
        startRoundError = nil

        let client = SupabaseClientProvider.shared.client
        do {
            _ = try await client
                .rpc("start_round", params: [
                    "p_table_id": tableId
                ])

            // Reload rounds after starting
            let repo = DiningTablesRepository()
            let updatedRounds = try await repo.fetchRounds(for: tableId)
            await MainActor.run {
                rounds = updatedRounds
            }
        } catch {
            await MainActor.run {
                startRoundError = "Failed to start a new round."
            }
            print("Failed to start round:", error)
        }

        isStartingRound = false
    }
}


