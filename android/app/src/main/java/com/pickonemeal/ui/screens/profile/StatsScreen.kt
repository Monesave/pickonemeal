package com.pickonemeal.ui.screens.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pickonemeal.data.api.SupabaseClientProvider
import com.pickonemeal.data.auth.LocalAuthState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class GamificationRowDto(
    @SerialName("table_id") val tableId: String? = null,
    @SerialName("table_name") val tableName: String? = null,
    @SerialName("season_year") val seasonYear: Int,
    @SerialName("total_points") val totalPoints: Int,
    @SerialName("meals_won") val mealsWon: Int,
    @SerialName("participation_rounds") val participationRounds: Int
)

@Composable
fun StatsScreen() {
    val authState = LocalAuthState.current
    val (rows, setRows) = remember { mutableStateOf<List<GamificationRowDto>>(emptyList()) }
    val (loading, setLoading) = remember { mutableStateOf(true) }
    val (error, setError) = remember { mutableStateOf<String?>(null) }

    LaunchedEffect(authState.session) {
        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@LaunchedEffect
        setLoading(true)
        setError(null)
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val client = SupabaseClientProvider.client
                val year = java.time.LocalDate.now().year
                val data = client
                    .rpc(
                        function = "get_gamification_summary",
                        parameters = mapOf(
                            "p_user_id" to userId,
                            "p_season_year" to year
                        )
                    )
                    .decodeList<GamificationRowDto>()
                setRows(data)
            } catch (t: Throwable) {
                setError("Failed to load stats.")
            } finally {
                setLoading(false)
            }
        }
    }

    val totals = rows.fold(Triple(0, 0, 0)) { acc, r ->
        Triple(
            acc.first + r.totalPoints,
            acc.second + r.mealsWon,
            acc.third + r.participationRounds
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Text(text = "My Points", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(8.dp))

        when {
            loading -> {
                CircularProgressIndicator()
            }
            error != null -> {
                Text(text = error ?: "", color = MaterialTheme.colorScheme.error)
            }
            rows.isEmpty() -> {
                Text(
                    text = "You don't have any points yet this year.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            else -> {
                Text(
                    text = "Points: ${totals.first} • Meals won: ${totals.second} • Rounds: ${totals.third}",
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(12.dp))
                LazyColumn {
                    items(rows) { row ->
                        Column(modifier = Modifier.padding(vertical = 4.dp)) {
                            Text(
                                text = row.tableName ?: "All tables",
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Text(
                                text = "Points: ${row.totalPoints} • Meals won: ${row.mealsWon} • Rounds: ${row.participationRounds}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}


