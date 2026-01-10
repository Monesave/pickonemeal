import Foundation

@MainActor
final class DiningTablesViewModel: ObservableObject {
    struct TableItem: Identifiable {
        let id: String
        let name: String
        let date: String
        let mealSlot: String
        let status: String
        let isOwner: Bool
    }

    @Published var tables: [TableItem] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let repository = DiningTablesRepository()

    func loadTables(userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let rows = try await repository.fetchTables(for: userId)
            tables = rows.map { row in
                TableItem(
                    id: row.id,
                    name: row.name,
                    date: row.date,
                    mealSlot: row.meal_slot,
                    status: row.status,
                    isOwner: row.owner_id == userId
                )
            }
        } catch {
            errorMessage = "Failed to load tables."
            print("Failed to load tables:", error)
        }
    }

    func createTable(
        ownerId: String,
        name: String,
        date: String,
        mealSlot: String
    ) async {
        do {
            let created = try await repository.createTable(
                ownerId: ownerId,
                name: name,
                date: date,
                mealSlot: mealSlot
            )
            let item = TableItem(
                id: created.id,
                name: created.name,
                date: created.date,
                mealSlot: created.meal_slot,
                status: created.status,
                isOwner: true
            )
            tables.insert(item, at: 0)
        } catch {
            errorMessage = "Failed to create table."
            print("Failed to create table:", error)
        }
    }
}


