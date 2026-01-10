import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @State private var summaryViewModel = HomeSummaryViewModel()

    // Local UI state (these can be wired to real data later)
    @State private var selectedDate = Date()
    @State private var selectedSlot: MealSlot = .breakfast
    @State private var consumed = 532
    @State private var target = 1200

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.96, green: 0.95, blue: 0.98)
                    .ignoresSafeArea()

                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {
                        header
                        dateStrip
                        progressCard
                        macroRow
                        plannedMealsSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 24)
                }
            }
            .navigationBarHidden(true)
            .task {
                if let userId = authViewModel.session?.user.id.uuidString {
                    await summaryViewModel.loadTodaySummary(userId: userId)
                }
            }
        }
    }

    // MARK: - Subviews

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Hi, \(authViewModel.session?.user.email ?? "there")")
                        .font(.system(.title3, weight: .semibold))
                    Text("Here’s your plan for today")
                        .font(.system(.subheadline))
                        .foregroundColor(.secondary)
                }
                Spacer()
                Circle()
                    .fill(Color.white)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Image(systemName: "person.fill")
                            .foregroundColor(.purple)
                    )
            }

            // Search bar
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                Text("Search meals")
                    .foregroundColor(.secondary)
                Spacer()
                RoundedRectangle(cornerRadius: 999)
                    .fill(Color.white)
                    .frame(width: 32, height: 32)
                    .overlay(
                        Image(systemName: "slider.horizontal.3")
                            .foregroundColor(.purple)
                            .font(.system(size: 14, weight: .semibold))
                    )
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.white)
            .cornerRadius(999)
            .shadow(color: Color.black.opacity(0.04), radius: 12, y: 4)
        }
    }

    private var dateStrip: some View {
        let calendar = Calendar.current
        let days = (0..<7).compactMap { offset -> Date? in
            calendar.date(byAdding: .day, value: offset, to: startOfWeek(for: selectedDate))
        }

        return HStack(spacing: 8) {
            ForEach(days, id: \.self) { day in
                let isSelected = calendar.isDate(day, inSameDayAs: selectedDate)
                VStack(spacing: 4) {
                    Text(dayFormatter.string(from: day))
                        .font(.caption2)
                        .foregroundColor(isSelected ? .white : .secondary)
                    Text(dayNumberFormatter.string(from: day))
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(isSelected ? .white : .primary)
                }
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isSelected ? Color.purple : Color.white)
                )
                .onTapGesture { selectedDate = day }
            }
        }
    }

    private var progressCard: some View {
        let remaining = max(target - consumed, 0)
        let progress = min(Double(consumed) / Double(target), 1.0)

        return RoundedRectangle(cornerRadius: 24)
            .fill(Color.white)
            .shadow(color: Color.black.opacity(0.05), radius: 16, y: 8)
            .overlay(
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("Today")
                            .font(.system(.subheadline, weight: .semibold))
                        Spacer()
                        Button(action: {}) {
                            Image(systemName: "calendar")
                                .font(.subheadline)
                        }
                        .foregroundColor(.purple)
                    }

                    HStack(spacing: 20) {
                        ZStack {
                            Circle()
                                .stroke(Color(.systemGray5), lineWidth: 14)

                            Circle()
                                .trim(from: 0, to: progress)
                                .stroke(
                                    AngularGradient(
                                        gradient: Gradient(colors: [Color.purple, Color.pink]),
                                        center: .center
                                    ),
                                    style: StrokeStyle(lineWidth: 14, lineCap: .round)
                                )
                                .rotationEffect(.degrees(-90))

                            VStack(spacing: 2) {
                                Text("\(consumed)")
                                    .font(.system(.title, weight: .semibold))
                                Text("Consumed")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .frame(width: 120, height: 120)

                        VStack(alignment: .leading, spacing: 8) {
                            statRow(title: "Remaining", value: "\(remaining)")
                            statRow(title: "Target", value: "\(target)")
                        }
                    }
                }
                .padding(20)
            )
    }

    private var macroRow: some View {
        HStack(spacing: 12) {
            macroCard(title: "Protein", value: "42/77g", color: .purple)
            macroCard(title: "Carbs", value: "85/136g", color: .pink)
            macroCard(title: "Fat", value: "20/40g", color: .orange)
        }
    }

    private var plannedMealsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Planned Meals")
                    .font(.system(.headline))
                Spacer()
                Button("See All") {}
                    .font(.caption)
                    .foregroundColor(.purple)
            }

            // Segment control
            HStack(spacing: 8) {
                ForEach(MealSlot.allCases, id: \.self) { slot in
                    let isSelected = slot == selectedSlot
                    Text(slot.title)
                        .font(.caption)
                        .padding(.vertical, 6)
                        .padding(.horizontal, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 999)
                                .fill(isSelected ? Color.purple : Color.white)
                        )
                        .foregroundColor(isSelected ? .white : .primary)
                        .onTapGesture { selectedSlot = slot }
                }
            }

            VStack(spacing: 10) {
                // Wire these rows using summaryViewModel.slots and real meals
                PlannedMealRow(
                    title: "Breakfast",
                    subtitle: summaryViewModel.slots.first(where: { $0.mealSlot == "breakfast" })?.statusText ?? "Not chosen yet",
                    imageName: "sunrise.fill"
                )
                PlannedMealRow(
                    title: "Lunch",
                    subtitle: summaryViewModel.slots.first(where: { $0.mealSlot == "lunch" })?.statusText ?? "Not chosen yet",
                    imageName: "fork.knife"
                )
                PlannedMealRow(
                    title: "Dinner",
                    subtitle: summaryViewModel.slots.first(where: { $0.mealSlot == "dinner" })?.statusText ?? "Not chosen yet",
                    imageName: "moon.stars.fill"
                )
            }
        }
    }

    // MARK: - Helpers

    private func statRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.caption)
                .fontWeight(.semibold)
        }
    }

    private func macroCard(title: String, value: String, color: Color) -> some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color.white)
            .shadow(color: Color.black.opacity(0.03), radius: 8, y: 4)
            .overlay(
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(value)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(color)
                }
                .padding(10)
            )
    }

    private func startOfWeek(for date: Date) -> Date {
        let cal = Calendar.current
        let components = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return cal.date(from: components) ?? date
    }
}

// MARK: - Models & Subviews

enum MealSlot: CaseIterable {
    case breakfast, lunch, dinner

    var title: String {
        switch self {
        case .breakfast: return "Breakfast"
        case .lunch: return "Lunch"
        case .dinner: return "Dinner"
        }
    }
}

private struct PlannedMealRow: View {
    let title: String
    let subtitle: String
    let imageName: String

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white)
                Image(systemName: imageName)
                    .foregroundColor(.purple)
            }
            .frame(width: 56, height: 56)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Button(action: {}) {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Circle().fill(Color.purple))
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color.white)
        )
        .shadow(color: Color.black.opacity(0.04), radius: 8, y: 4)
    }
}

// MARK: - Date Formatters

private let dayFormatter: DateFormatter = {
    let df = DateFormatter()
    df.dateFormat = "E"
    return df
}()

private let dayNumberFormatter: DateFormatter = {
    let df = DateFormatter()
    df.dateFormat = "d"
    return df
}()

