import SwiftUI

struct SwipeView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @State private var viewModel = SwipeMealsViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.96, green: 0.95, blue: 0.98)
                    .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 20) {
                    Text("Swipe meals")
                        .font(.title2.bold())
                    Text("Plan your solo meals for today. You can choose up to 3 meals per day.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    // Segmented control
                    HStack(spacing: 8) {
                        ForEach(SwipeMealsViewModel.MealSlot.allCases, id: \.self) { slot in
                            let isSelected = slot == viewModel.selectedSlot
                            Text(slot.title)
                                .font(.caption)
                                .padding(.vertical, 6)
                                .padding(.horizontal, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 999)
                                        .fill(isSelected ? Color.purple : Color.white)
                                )
                                .foregroundColor(isSelected ? .white : .primary)
                                .onTapGesture {
                                    viewModel.selectedSlot = slot
                                }
                        }
                    }

                    Text("Remaining today: \(max(viewModel.remaining, 0))")
                        .font(.caption)
                        .foregroundColor(viewModel.remaining <= 0 ? .red : .secondary)

                    if viewModel.isLoading {
                        ProgressView("Loading meals…")
                            .padding(.top, 16)
                    } else if let meal = viewModel.currentMeal {
                        MealCardView(
                            meal: meal,
                            canLike: viewModel.remaining > 0,
                            onDislike: {
                                Task { await viewModel.recordDecision(.dislike, userId: authViewModel.session?.user.id.uuidString) }
                            },
                            onSkip: {
                                Task { await viewModel.recordDecision(.skip, userId: authViewModel.session?.user.id.uuidString) }
                            },
                            onLike: {
                                Task { await viewModel.recordDecision(.like, userId: authViewModel.session?.user.id.uuidString) }
                            }
                        )
                    } else {
                        Text("No more meals to show right now. Try again later.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.top, 16)
                    }

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.footnote)
                            .foregroundColor(.red)
                    }

                    Spacer()
                }
                .padding(20)
            }
            .navigationTitle("Swipe")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                if let userId = authViewModel.session?.user.id.uuidString {
                    await viewModel.bootstrap(userId: userId)
                }
            }
        }
    }
}

private struct MealCardView: View {
    let meal: SwipeMealsViewModel.Meal
    let canLike: Bool
    let onDislike: () -> Void
    let onSkip: () -> Void
    let onLike: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.white)
                Image(systemName: "fork.knife.circle.fill")
                    .resizable()
                    .scaledToFit()
                    .foregroundColor(.purple.opacity(0.8))
                    .padding(24)
            }
            .frame(height: 180)

            Text(meal.title)
                .font(.headline)
            if let description = meal.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            if let prep = meal.prepTimeMinutes {
                Text("Prep time: \(prep) min")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 12) {
                Button(action: onDislike) {
                    Text("Dislike")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button(action: onSkip) {
                    Text("Skip")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                Button(action: {
                    if canLike { onLike() }
                }) {
                    Text(canLike ? "Like & plan" : "Limit reached")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(!canLike)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.06), radius: 16, y: 8)
        )
    }
}



