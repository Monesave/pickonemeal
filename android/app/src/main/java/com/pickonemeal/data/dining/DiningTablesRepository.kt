package com.pickonemeal.data.dining

import com.pickonemeal.data.api.SupabaseClientProvider
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.rpc
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DiningTableRow(
    val id: String,
    val name: String,
    val date: String,
    @SerialName("meal_slot") val mealSlot: String,
    val status: String,
    @SerialName("owner_id") val ownerId: String
)

class DiningTablesRepository {
    private val client = SupabaseClientProvider.client

    @Serializable
    private data class ParticipantRow(
        val dining_tables: DiningTableRow
    )

    suspend fun fetchTables(userId: String): List<DiningTableRow> {
        return client
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
                """.trimIndent()
            )
            .eq("user_id", userId)
            .order(
                column = "date",
                foreignTable = "dining_tables",
                ascending = false
            )
            .decodeList<ParticipantRow>()
            .map { it.dining_tables }
    }

    suspend fun createTable(
        ownerId: String,
        name: String,
        date: String,
        mealSlot: String
    ): DiningTableRow {
        // Use RPC to enforce subscription rules server-side
        return client
            .rpc(
                function = "create_dining_table",
                parameters = mapOf(
                    "p_name" to name,
                    "p_date" to date,
                    "p_meal_slot" to mealSlot
                )
            )
            .decodeSingle<DiningTableRow>()
    }

    @Serializable
    data class TableInvite(
        val name: String,
        @SerialName("invite_token") val inviteToken: String
    )

    suspend fun getTableInvite(tableId: String): TableInvite {
        return client
            .from("dining_tables")
            .select(columns = "name,invite_token")
            .eq("id", tableId)
            .decodeSingle<TableInvite>()
    }

    suspend fun joinTable(tableId: String, token: String, userId: String) {
        // Validate token
        val table = client
            .from("dining_tables")
            .select(columns = "id, invite_token")
            .eq("id", tableId)
            .eq("invite_token", token)
            .decodeSingle<TableInvite>()

        if (table.inviteToken != token) {
            throw IllegalStateException("Invalid invite token")
        }

        client
            .from("dining_table_participants")
            .upsert(
                mapOf(
                    "table_id" to tableId,
                    "user_id" to userId,
                    "role" to "member"
                )
            )
    }

    // ----- Rounds & voting -----

    @Serializable
    data class TableRound(
        val id: String,
        @SerialName("round_number") val roundNumber: Int,
        val status: String,
        @SerialName("decision_reason") val decisionReason: String? = null,
        val meals: MealTitle? = null
    )

    @Serializable
    data class MealTitle(val title: String? = null)

    suspend fun fetchRounds(tableId: String): List<TableRound> =
        client
            .from("voting_rounds")
            .select("id,round_number,status,decision_reason,meals:decided_meal_id(title)")
            .eq("table_id", tableId)
            .order("round_number", ascending = false)
            .decodeList<TableRound>()

    @Serializable
    data class RoundMealRow(
        @SerialName("meals") val meal: MealRow
    )

    @Serializable
    data class MealRow(
        val id: String,
        val title: String,
        val description: String? = null,
        @SerialName("prep_time_minutes") val prepTimeMinutes: Int? = null
    )

    suspend fun fetchRoundMeals(roundId: String): List<MealRow> =
        client
            .from("round_meals")
            .select("meals(id,title,description,prep_time_minutes)")
            .eq("round_id", roundId)
            .decodeList<RoundMealRow>()
            .map { it.meal }

    @Serializable
    data class RoundVoteRow(
        @SerialName("meal_id") val mealId: String,
        val vote: String
    )

    suspend fun fetchUserVotes(roundId: String, userId: String): List<RoundVoteRow> =
        client
            .from("round_votes")
            .select("meal_id,vote")
            .eq("round_id", roundId)
            .eq("user_id", userId)
            .decodeList<RoundVoteRow>()

    suspend fun upsertVote(
        roundId: String,
        tableId: String,
        mealId: String,
        userId: String,
        vote: String
    ) {
        client
            .from("round_votes")
            .upsert(
                mapOf(
                    "round_id" to roundId,
                    "table_id" to tableId,
                    "meal_id" to mealId,
                    "user_id" to userId,
                    "vote" to vote
                )
            )
    }
}


