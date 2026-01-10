package com.pickonemeal.ui.screens.tables

import android.content.Intent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.pickonemeal.data.auth.LocalAuthState
import com.pickonemeal.data.dining.DiningTablesRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

@Composable
fun TableDetailScreen(
    tableId: String,
    inviteToken: String? = null
) {
    val repository = remember { DiningTablesRepository() }
    val authState = LocalAuthState.current
    val tableName = remember { mutableStateOf<String?>(null) }
    val inviteUrl = remember { mutableStateOf<String?>(null) }
    val rounds = remember { mutableStateOf<List<DiningTablesRepository.TableRound>>(emptyList()) }
    val isOwner = remember { mutableStateOf(false) }
    val isStartingRound = remember { mutableStateOf(false) }
    val startRoundError = remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    LaunchedEffect(tableId, inviteToken, authState.session) {
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val userId = authState.session?.sessionOrNull()?.user?.id
                if (userId != null && inviteToken != null) {
                    // Attempt to join table using invite token
                    try {
                        repository.joinTable(tableId, inviteToken, userId)
                    } catch (_: Throwable) {
                        // Ignore join failure for now (already member, invalid, etc.)
                    }
                }

                val invite = repository.getTableInvite(tableId)
                val r = repository.fetchRounds(tableId)
                tableName.value = invite.name
                inviteUrl.value = "https://pickonemeal.com/table/$tableId?token=${invite.inviteToken}"
                rounds.value = r
                isOwner.value = authState.session?.sessionOrNull()?.user?.id == invite.ownerId
            } catch (_: Throwable) {
                tableName.value = null
                inviteUrl.value = null
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = tableName.value ?: "Dining Table") }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text(
                text = "Invite others",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))

            inviteUrl.value?.let { url ->
                Text(
                    text = url,
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = {
                        val sendIntent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, url)
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, "Share invite link")
                        context.startActivity(shareIntent)
                    }
                ) {
                    Text("Share invite link")
                }
            } ?: run {
                Text(
                    text = "Loading invite link…",
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (isOwner.value) {
                Text(
                    text = "Owner actions",
                    style = MaterialTheme.typography.titleSmall
                )
                Spacer(modifier = Modifier.height(8.dp))
                if (startRoundError.value != null) {
                    Text(
                        text = startRoundError.value!!,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                }
                Button(
                    enabled = !isStartingRound.value,
                    onClick = {
                        isStartingRound.value = true
                        startRoundError.value = null
                        GlobalScope.launch(Dispatchers.IO) {
                            try {
                                val client = com.pickonemeal.data.api.SupabaseClientProvider.client
                                client.rpc(
                                    function = "start_round",
                                    parameters = mapOf("p_table_id" to tableId)
                                )
                                val updated = repository.fetchRounds(tableId)
                                rounds.value = updated
                            } catch (t: Throwable) {
                                startRoundError.value = "Failed to start a new round."
                            } finally {
                                isStartingRound.value = false
                            }
                        }
                    }
                ) {
                    if (isStartingRound.value) {
                        CircularProgressIndicator()
                    } else {
                        Text("Start new round")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
            }

            Text(
                text = "Rounds",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            if (rounds.value.isEmpty()) {
                Text(
                    text = "No rounds yet.",
                    style = MaterialTheme.typography.bodySmall
                )
            } else {
                rounds.value.forEach { round ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .clickable {
                                // Navigation into RoundScreen is wired in AppNavHost via a separate route
                            }
                            .padding(vertical = 4.dp)
                    ) {
                        Text(
                            text = "Round ${round.roundNumber} • ${round.status}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                        round.meals?.title?.let { title ->
                            Text(
                                text = "Winner: $title",
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

