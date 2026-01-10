import SwiftUI

struct RoundVotingView: View {
    let tableId: String
    let roundId: String
    let roundNumber: Int

    @EnvironmentObject private var authViewModel: AuthViewModel

    @State private var meals: [DiningTablesRepository.RoundMeal] = []
    @State private var votes: [String: String] = [:]
    @State private var currentIndex: Int = 0
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showConfetti = false
    @State private var roundStatus: String = "active"
    @State private var winnerTitle: String?

    private var currentMeal: DiningTablesRepository.RoundMeal? {
        guard currentIndex < meals.count else { return nil }
        return meals[currentIndex]
    }

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()

            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Round \(roundNumber)")
                        .font(.title2.bold())
                    if let winnerTitle {
                        Text("Winner: \(winnerTitle)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    } else if roundStatus != "active" {
                        Text("Round finished")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }

                if isLoading {
                    ProgressView("Loading meals…")
                } else if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundColor(.red)
                } else if let meal = currentMeal {
                    mealCard(meal)
                } else {
                    Text("You’ve voted on all meals in this round.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }
            .padding()

            if showConfetti {
                ConfettiOverlay()
                    .transition(.opacity)
            }
        }
        .navigationTitle("Vote")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadRound()
        }
    }

    // MARK: - Card

    private func mealCard(_ meal: DiningTablesRepository.RoundMeal) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(meal.title)
                .font(.headline)

            if let description = meal.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            if let prep = meal.prep_time_minutes {
                Text("Prep time: \(prep) min")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 12) {
                Button {
                    Task { await vote("dislike") }
                } label: {
                    Text("Dislike")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button {
                    Task { await vote("skip") }
                } label: {
                    Text("Skip")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button {
                    Task { await vote("like") }
                } label: {
                    Text("Like")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }

            Text("Card \(currentIndex + 1) of \(meals.count)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.secondarySystemBackground))
        )
    }

    // MARK: - Data

    private func loadRound() async {
        guard let userId = authViewModel.session?.user.id.uuidString else { return }
        isLoading = true
        errorMessage = nil

        let repo = DiningTablesRepository()
        do {
            async let metaResponse = repo.fetchRoundMeta(roundId: roundId)
            async let mealsResponse = repo.fetchRoundMeals(roundId: roundId)
            async let votesResponse = repo.fetchUserVotes(roundId: roundId, userId: userId)

            let fetchedMeta = try await metaResponse
            let fetchedMeals = try await mealsResponse
            let fetchedVotes = try await votesResponse

            meals = fetchedMeals
            votes = Dictionary(uniqueKeysWithValues: fetchedVotes.map { ($0.meal_id, $0.vote) })

            if let meta = fetchedMeta {
                roundStatus = meta.status
                winnerTitle = meta.meals?.title
            }

            if let idx = meals.firstIndex(where: { votes[$0.id] == nil }) {
                currentIndex = idx
            } else {
                currentIndex = 0
            }
        } catch {
            errorMessage = "Failed to load round."
            print("Failed to load round:", error)
        }

        isLoading = false
    }

    private func vote(_ value: String) async {
        guard let userId = authViewModel.session?.user.id.uuidString,
              let meal = currentMeal else { return }

        let repo = DiningTablesRepository()
        do {
            try await repo.upsertVote(
                roundId: roundId,
                tableId: tableId,
                mealId: meal.id,
                userId: userId,
                vote: value
            )

            votes[meal.id] = value

            // Refresh round metadata to see if a winner has been decided
            if let meta = try await repo.fetchRoundMeta(roundId: roundId) {
                roundStatus = meta.status
                winnerTitle = meta.meals?.title
            }

            if let next = meals.firstIndex(where: { votes[$0.id] == nil }) {
                withAnimation {
                    currentIndex = next
                }
            } else if winnerTitle != nil || roundStatus != "active" {
                // Finished all votes and round is decided: show confetti once
                withAnimation {
                    showConfetti = true
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    withAnimation {
                        showConfetti = false
                    }
                }
            }
        } catch {
            errorMessage = "Failed to save your vote."
            print("Failed to save vote:", error)
        }
    }
}

// MARK: - Simple Confetti Overlay

struct ConfettiOverlay: View {
    var body: some View {
        GeometryReader { geo in
            ForEach(0..<24, id: \.self) { i in
                Text(emoji(for: i))
                    .font(.system(size: 24))
                    .position(
                        x: CGFloat.random(in: 0...geo.size.width),
                        y: CGFloat.random(in: -40...0)
                    )
                    .animation(
                        Animation.easeOut(duration: 1.2)
                            .delay(Double(i % 5) * 0.05),
                        value: UUID()
                    )
            }
        }
        .ignoresSafeArea()
        .transition(.opacity)
    }

    private func emoji(for index: Int) -> String {
        switch index % 3 {
        case 0: return "🎉"
        case 1: return "✨"
        default: return "🥘"
        }
    }
}


