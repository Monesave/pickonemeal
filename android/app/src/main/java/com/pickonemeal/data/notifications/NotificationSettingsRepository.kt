package com.pickonemeal.data.notifications

import com.pickonemeal.data.api.SupabaseClientProvider
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class NotificationSettingsDto(
    @SerialName("leading_chef_picks_enabled") val leadingChefPicksEnabled: Boolean? = null,
    @SerialName("table_winner_enabled") val tableWinnerEnabled: Boolean? = null,
    @SerialName("fcm_token") val fcmToken: String? = null
)

data class NotificationSettings(
    val leadingChefPicksEnabled: Boolean,
    val tableWinnerEnabled: Boolean,
    val fcmToken: String?
)

object NotificationSettingsRepository {

    suspend fun fetch(userId: String): NotificationSettings {
        val client = SupabaseClientProvider.client

        return try {
            val dto = client
                .from("user_notification_settings")
                .select("leading_chef_picks_enabled,table_winner_enabled,fcm_token")
                .eq("user_id", userId)
                .maybeSingle()
                .decodeAs<NotificationSettingsDto?>()

            NotificationSettings(
                leadingChefPicksEnabled = dto?.leadingChefPicksEnabled ?: true,
                tableWinnerEnabled = dto?.tableWinnerEnabled ?: true,
                fcmToken = dto?.fcmToken
            )
        } catch (_: Throwable) {
            NotificationSettings(
                leadingChefPicksEnabled = true,
                tableWinnerEnabled = true,
                fcmToken = null
            )
        }
    }

    suspend fun upsert(
        userId: String,
        leadingChefPicksEnabled: Boolean,
        tableWinnerEnabled: Boolean
    ) {
        val client = SupabaseClientProvider.client
        client
            .from("user_notification_settings")
            .upsert(
                mapOf(
                    "user_id" to userId,
                    "leading_chef_picks_enabled" to leadingChefPicksEnabled,
                    "table_winner_enabled" to tableWinnerEnabled
                ),
                onConflict = "user_id"
            )
    }

    suspend fun updateFcmToken(userId: String, token: String) {
        val client = SupabaseClientProvider.client
        client
            .from("user_notification_settings")
            .upsert(
                mapOf(
                    "user_id" to userId,
                    "fcm_token" to token
                ),
                onConflict = "user_id"
            )
    }
}


