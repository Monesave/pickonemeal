import Foundation
import Supabase

@MainActor
final class HomeSummaryViewModel: ObservableObject {
    struct SlotSummary: Identifiable {
        enum Status {
            case decided(mealTitle: String?)
            case skipped
            case none
        }

        let id = UUID()
        let mealSlot: String // "breakfast" | "lunch" | "dinner"
        let status: Status

        var mealSlotTitle: String {
            mealSlot.capitalized
        }

        var statusText: String {
            switch status {
            case .decided(let title):
                if let title, !title.isEmpty {
                    return "Decided: \(title)"
                } else {
                    return "Decided"
                }
            case .skipped:
                return "Skipped"
            case .none:
                return "Not chosen yet. Swipe to pick a meal."
            }
        }
    }

    @Published var slots: [SlotSummary] = [
        SlotSummary(mealSlot: "breakfast", status: .none),
        SlotSummary(mealSlot: "lunch", status: .none),
        SlotSummary(mealSlot: "dinner", status: .none)
    ]
    @Published var isLoading: Bool = false

    private let client = SupabaseClientProvider.shared.client

    func loadTodaySummary(userId: String) async {
        isLoading = true
        defer { isLoading = false }

        struct MealTitle: Decodable {
            let title: String?
        }

        struct PlanRow: Decodable {
            let meal_slot: String
            let status: String
            let meals: MealTitle?
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())

        do {
            let response = try await client
                .from("user_daily_plans")
                .select("meal_slot,status,meals(title)")
                .eq(column: "user_id", value: userId)
                .eq(column: "date", value: today)
                .execute()

            let rows = try response.decoded(to: [PlanRow].self)

            let baseSlots = ["breakfast", "lunch", "dinner"]

            slots = baseSlots.map { slot in
                if let row = rows.first(where: { $0.meal_slot == slot }) {
                    let status: SlotSummary.Status
                    switch row.status {
                    case "decided":
                        status = .decided(mealTitle: row.meals?.title)
                    case "skipped":
                        status = .skipped
                    default:
                        status = .none
                    }
                    return SlotSummary(mealSlot: slot, status: status)
                } else {
                    return SlotSummary(mealSlot: slot, status: .none)
                }
            }
        } catch {
            print("Failed to load home summary:", error)
        }
    }
}


