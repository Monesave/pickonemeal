import Foundation
import Supabase

struct DiningTableListItem: Decodable, Identifiable {
    let id: String
    let name: String
    let date: String
    let meal_slot: String
    let status: String
    let owner_id: String
}

@MainActor
final class DiningTablesRepository {
    private let client = SupabaseClientProvider.shared.client

    func fetchTables(for userId: String) async throws -> [DiningTableListItem] {
        struct Row: Decodable {
            let dining_tables: DiningTableListItem
        }

        let response = try await client
            .from("dining_table_participants")
            .select(
                """
                dining_tables:id (
                  id,
                  name,
                  date,
                  meal_slot,
                  status,
                  owner_id
                )
                """
            )
            .eq(column: "user_id", value: userId)
            .order(column: "date", ascending: false, foreignTable: "dining_tables")
            .execute()

        let rows = try response.decoded(to: [Row].self)
        return rows.map { $0.dining_tables }
    }

    func createTable(
        ownerId: String,
        name: String,
        date: String,
        mealSlot: String
    ) async throws -> DiningTableListItem {
        // RPC: public.create_dining_table(p_name, p_date, p_meal_slot)
        let response = try await client
            .rpc("create_dining_table", params: [
                "p_name": name,
                "p_date": date,
                "p_meal_slot": mealSlot
            ])

        // The RPC returns a dining_tables row
        return try response.decoded(to: DiningTableListItem.self)
    }

    // MARK: - Rounds & Voting

    struct TableRound: Decodable, Identifiable {
        let id: String
        let round_number: Int
        let status: String
        let decision_reason: String?
        let meals: MealTitle?

        struct MealTitle: Decodable {
            let title: String?
        }
    }

    struct RoundMeal: Decodable, Identifiable {
        let id: String
        let title: String
        let description: String?
        let prep_time_minutes: Int?

        var ident: String { id }
        var identifier: String { id }
    }

    struct RoundVote: Decodable {
        let meal_id: String
        let vote: String
    }

    func fetchRoundMeta(roundId: String) async throws -> TableRound? {
        let response = try await client
            .from("voting_rounds")
            .select("id,round_number,status,decision_reason,meals:decided_meal_id(title)")
            .eq(column: "id", value: roundId)
            .maybeSingle()

        if let response {
            return try response.decoded(to: TableRound.self)
        }
        return nil
    }

    func fetchRounds(for tableId: String) async throws -> [TableRound] {
        let response = try await client
            .from("voting_rounds")
            .select("id,round_number,status,decision_reason,meals:decided_meal_id(title)")
            .eq(column: "table_id", value: tableId)
            .order(column: "round_number", ascending: false)
            .execute()

        return try response.decoded(to: [TableRound].self)
    }

    func fetchRoundMeals(roundId: String) async throws -> [RoundMeal] {
        struct Row: Decodable {
            let meals: RoundMeal
        }

        let response = try await client
            .from("round_meals")
            .select("meals(id,title,description,prep_time_minutes)")
            .eq(column: "round_id", value: roundId)
            .execute()

        let rows = try response.decoded(to: [Row].self)
        return rows.map { $0.meals }
    }

    func fetchUserVotes(roundId: String, userId: String) async throws -> [RoundVote] {
        let response = try await client
            .from("round_votes")
            .select("meal_id,vote")
            .eq(column: "round_id", value: roundId)
            .eq(column: "user_id", value: userId)
            .execute()

        return try response.decoded(to: [RoundVote].self)
    }

    func upsertVote(
        roundId: String,
        tableId: String,
        mealId: String,
        userId: String,
        vote: String
    ) async throws {
        _ = try await client
            .from("round_votes")
            .upsert(values: [
                "round_id": roundId,
                "table_id": tableId,
                "meal_id": mealId,
                "user_id": userId,
                "vote": vote
            ])
            .execute()
    }
}


