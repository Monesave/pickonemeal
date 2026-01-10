package com.pickonemeal.data.planning

import com.pickonemeal.data.api.SupabaseClientProvider
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

class PlanningRepository {

    private val client = SupabaseClientProvider.client

    @Serializable
    data class DailyPlanRow(
        @SerialName("meal_slot") val mealSlot: String,
        val status: String,
        val meals: MealTitle? = null
    )

    @Serializable
    data class MealTitle(
        val title: String? = null
    )

    @Serializable
    data class SwipeCounterRow(
        @SerialName("swipe_count") val swipeCount: Int
    )

    @Serializable
    data class MealRow(
        val id: String,
        val title: String,
        val description: String? = null,
        @SerialName("prep_time_minutes") val prepTimeMinutes: Int? = null
    )

    suspend fun loadTodayPlans(userId: String, isoDate: String): List<DailyPlanRow> =
        withContext(Dispatchers.IO) {
            client
                .from("user_daily_plans")
                .select(columns = "meal_slot,status,meals(title)")
                .eq("user_id", userId)
                .eq("date", isoDate)
                .decodeList<DailyPlanRow>()
        }

    suspend fun loadSwipeCounter(userId: String, isoDate: String): Int =
        withContext(Dispatchers.IO) {
            val rows = client
                .from("user_swipe_counters")
                .select(columns = "swipe_count")
                .eq("user_id", userId)
                .eq("date", isoDate)
                .decodeList<SwipeCounterRow>()

            rows.firstOrNull()?.swipeCount ?: 0
        }

    suspend fun loadMeals(limit: Int = 20): List<MealRow> =
        withContext(Dispatchers.IO) {
            client
                .from("meals")
                .select(columns = "id,title,description,prep_time_minutes")
                .eq("is_active", true)
                .limit(limit.toLong())
                .decodeList<MealRow>()
        }

    suspend fun upsertDailyPlan(
        userId: String,
        isoDate: String,
        mealSlot: String,
        status: String,
        mealId: String?
    ) = withContext(Dispatchers.IO) {
        val payload = buildMap<String, Any?> {
            put("user_id", userId)
            put("date", isoDate)
            put("meal_slot", mealSlot)
            put("status", status)
            put("meal_id", mealId)
        }

        client
            .from("user_daily_plans")
            .upsert(payload)
    }

    suspend fun upsertSwipeCounter(
        userId: String,
        isoDate: String,
        value: Int
    ): Int = withContext(Dispatchers.IO) {
        val payload = mapOf(
            "user_id" to userId,
            "date" to isoDate,
            "swipe_count" to value
        )

        client
            .from("user_swipe_counters")
            .upsert(payload)
            .decodeSingle<SwipeCounterRow>()
            .swipeCount
    }
}


