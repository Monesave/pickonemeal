import Foundation
import Supabase

@MainActor
final class SwipeMealsViewModel: ObservableObject {
    enum MealSlot: String, CaseIterable {
        case breakfast
        case lunch
        case dinner

        var title: String { rawValue.capitalized }
    }

    enum Decision {
        case like
        case skip
        case dislike
    }

    struct Meal: Identifiable {
        let id: String
        let title: String
        let description: String?
        let prepTimeMinutes: Int?
    }

    @Published var selectedSlot: MealSlot = .dinner
    @Published var meals: [Meal] = []
    @Published var currentIndex: Int = 0
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var swipeCount: Int = 0

    private let client = SupabaseClientProvider.shared.client
    private let dailyLimit = 3

    var remaining: Int {
        dailyLimit - swipeCount
    }

    var currentMeal: Meal? {
        guard currentIndex < meals.count else { return nil }
        return meals[currentIndex]
    }

    func bootstrap(userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        struct CounterRow: Decodable {
            let swipe_count: Int
        }
        struct MealRow: Decodable {
            let id: String
            let title: String
            let description: String?
            let prep_time_minutes: Int?
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())

        do {
            async let counterResponse = client
                .from("user_swipe_counters")
                .select("swipe_count")
                .eq(column: "user_id", value: userId)
                .eq(column: "date", value: today)
                .maybeSingle()

            async let mealsResponse = client
                .from("meals")
                .select("id,title,description,prep_time_minutes")
                .eq(column: "is_active", value: true)
                .limit(20)
                .execute()

            let counter = try await counterResponse
            if let counter {
                let row = try counter.decoded(to: CounterRow.self)
                swipeCount = row.swipe_count
            } else {
                swipeCount = 0
            }

            let mealsExec = try await mealsResponse
            let mealRows = try mealsExec.decoded(to: [MealRow].self)

            meals = mealRows.map {
                Meal(
                    id: $0.id,
                    title: $0.title,
                    description: $0.description,
                    prepTimeMinutes: $0.prep_time_minutes
                )
            }
            currentIndex = 0
        } catch {
            errorMessage = "Failed to load meals."
            print("Failed to bootstrap swipe view:", error)
        }
    }

    func recordDecision(_ decision: Decision, userId: String?) async {
        guard let userId, let meal = currentMeal else { return }
        if decision == .like && remaining <= 0 { return }

        errorMessage = nil

        struct CounterRow: Decodable {
            let swipe_count: Int
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())

        let status: String
        switch decision {
        case .like: status = "decided"
        case .skip: status = "skipped"
        case .dislike: status = "none"
        }

        do {
            // Upsert daily plan
            try await client
                .from("user_daily_plans")
                .upsert(values: [
                    "user_id": userId,
                    "date": today,
                    "meal_slot": selectedSlot.rawValue,
                    "status": status,
                    "meal_id": decision == .like ? meal.id : NSNull()
                ])
                .execute()

            if decision == .like {
                // Increment swipe counter
                let response = try await client
                    .from("user_swipe_counters")
                    .upsert(values: [
                        "user_id": userId,
                        "date": today,
                        "swipe_count": swipeCount + 1
                    ])
                    .select("swipe_count")
                    .maybeSingle()

                if let response {
                    let row = try response.decoded(to: CounterRow.self)
                    swipeCount = row.swipe_count
                } else {
                    swipeCount += 1
                }
            }

            advanceCard()
        } catch {
            errorMessage = "Failed to save your choice."
            print("Failed to record decision:", error)
        }
    }

    private func advanceCard() {
        if currentIndex + 1 < meals.count {
            currentIndex += 1
        }
    }
}


