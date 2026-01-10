import Foundation
import Supabase

struct NotificationSettings: Decodable {
    var leadingChefPicksEnabled: Bool
    var tableWinnerEnabled: Bool
    var apnsToken: String?
}

@MainActor
final class NotificationSettingsRepository {
    private let client = SupabaseClientProvider.shared.client

    func fetchSettings(for userId: String) async throws -> NotificationSettings {
        struct Row: Decodable {
            let leading_chef_picks_enabled: Bool?
            let table_winner_enabled: Bool?
            let apns_token: String?
        }

        let response = try await client
            .from("user_notification_settings")
            .select("leading_chef_picks_enabled, table_winner_enabled, apns_token")
            .eq(column: "user_id", value: userId)
            .maybeSingle()

        if let response {
            let row = try response.decoded(to: Row.self)
            return NotificationSettings(
                leadingChefPicksEnabled: row.leading_chef_picks_enabled ?? true,
                tableWinnerEnabled: row.table_winner_enabled ?? true,
                apnsToken: row.apns_token
            )
        } else {
            // Default: all notifications on
            return NotificationSettings(
                leadingChefPicksEnabled: true,
                tableWinnerEnabled: true,
                apnsToken: nil
            )
        }
    }

    func upsertSettings(
        for userId: String,
        leadingChefPicksEnabled: Bool,
        tableWinnerEnabled: Bool
    ) async throws {
        _ = try await client
            .from("user_notification_settings")
            .upsert(
                values: [
                    "user_id": userId,
                    "leading_chef_picks_enabled": leadingChefPicksEnabled,
                    "table_winner_enabled": tableWinnerEnabled
                ],
                onConflict: "user_id"
            )
            .execute()
    }

    func updateApnsToken(for userId: String, token: String) async throws {
        _ = try await client
            .from("user_notification_settings")
            .upsert(
                values: [
                    "user_id": userId,
                    "apns_token": token
                ],
                onConflict: "user_id"
            )
            .execute()
    }
}


