package com.pickonemeal.ui.screens.tables

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pickonemeal.data.auth.LocalAuthState
import com.pickonemeal.data.dining.DiningTablesRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

@Composable
fun RoundScreen(
    tableId: String,
    roundId: String
) {
    val authState = LocalAuthState.current
    val repo = remember { DiningTablesRepository() }

    val isLoading = remember { mutableStateOf(true) }
    val error = remember { mutableStateOf<String?>(null) }
    val meals = remember { mutableStateOf<List<DiningTablesRepository.MealRow>>(emptyList()) }
    val votes = remember { mutableStateOf<MutableMap<String, String>>(mutableMapOf()) }
    val currentIndex = remember { mutableStateOf(0) }
    val showConfetti = remember { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(roundId, authState.session) {
        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@LaunchedEffect
        isLoading.value = true
        error.value = null

        GlobalScope.launch(Dispatchers.IO) {
            try {
                val ms = repo.fetchRoundMeals(roundId)
                val vs = repo.fetchUserVotes(roundId, userId)
                val map = mutableMapOf<String, String>()
                vs.forEach { map[it.mealId] = it.vote }

                meals.value = ms
                votes.value = map
                val firstUnvoted = ms.indexOfFirst { !map.containsKey(it.id) }
                currentIndex.value = if (firstUnvoted == -1) 0 else firstUnvoted
            } catch (t: Throwable) {
                error.value = "Failed to load round."
            } finally {
                isLoading.value = false
            }
        }
    }

    val currentMeal = meals.value.getOrNull(currentIndex.value)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Round voting") }
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            when {
                isLoading.value -> {
                    CircularProgressIndicator()
                }
                error.value != null -> {
                    Text(
                        text = error.value ?: "",
                        color = MaterialTheme.colorScheme.error
                    )
                }
                currentMeal == null -> {
                    Text(
                        text = "You’ve voted on all meals in this round.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    if (showConfetti.value) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Your points will be updated when a winner is decided.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                else -> {
                    Text(
                        text = currentMeal.title,
                        style = MaterialTheme.typography.titleMedium
                    )
                    currentMeal.description?.let {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    currentMeal.prepTimeMinutes?.let {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Prep time: $it min",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row {
                        OutlinedButton(
                            onClick = {
                                voteOnMeal(
                                    repo = repo,
                                    tableId = tableId,
                                    roundId = roundId,
                                    mealId = currentMeal.id,
                                    vote = "dislike",
                                    authState = authState,
                                    meals = meals.value,
                                    currentIndex = currentIndex,
                                    votes = votes,
                                    error = error,
                                    showConfetti = showConfetti,
                                    snackbarHostState = snackbarHostState
                                )
                            }
                        ) {
                            Text("Dislike")
                        }
                        Spacer(modifier = Modifier.height(0.dp).weight(1f))
                        OutlinedButton(
                            onClick = {
                                voteOnMeal(
                                    repo = repo,
                                    tableId = tableId,
                                    roundId = roundId,
                                    mealId = currentMeal.id,
                                    vote = "skip",
                                    authState = authState,
                                    meals = meals.value,
                                    currentIndex = currentIndex,
                                    votes = votes,
                                    error = error,
                                    showConfetti = showConfetti,
                                    snackbarHostState = snackbarHostState
                                )
                            }
                        ) {
                            Text("Skip")
                        }
                        Spacer(modifier = Modifier.height(0.dp).weight(1f))
                        Button(
                            onClick = {
                                voteOnMeal(
                                    repo = repo,
                                    tableId = tableId,
                                    roundId = roundId,
                                    mealId = currentMeal.id,
                                    vote = "like",
                                    authState = authState,
                                    meals = meals.value,
                                    currentIndex = currentIndex,
                                    votes = votes,
                                    error = error,
                                    showConfetti = showConfetti,
                                    snackbarHostState = snackbarHostState
                                )
                            }
                        ) {
                            Text("Like")
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Card ${currentIndex.value + 1} of ${meals.value.size}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

private fun voteOnMeal(
    repo: DiningTablesRepository,
    tableId: String,
    roundId: String,
    mealId: String,
    vote: String,
    authState: com.pickonemeal.data.auth.AuthStateHolder,
    meals: List<DiningTablesRepository.MealRow>,
    currentIndex: androidx.compose.runtime.MutableState<Int>,
    votes: androidx.compose.runtime.MutableState<MutableMap<String, String>>,
    error: androidx.compose.runtime.MutableState<String?>,
    showConfetti: MutableState<Boolean>,
    snackbarHostState: SnackbarHostState
) {
    val userId = authState.session?.sessionOrNull()?.user?.id ?: return
    GlobalScope.launch(Dispatchers.IO) {
        try {
            repo.upsertVote(roundId, tableId, mealId, userId, vote)
            votes.value[mealId] = vote
            // advance to next unvoted
            val nextIndex = meals.indexOfFirst {
                !votes.value.containsKey(it.id)
            }
            if (nextIndex != -1) {
                currentIndex.value = nextIndex
            } else {
                // user has voted on all cards: show lightweight celebration
                showConfetti.value = true
                GlobalScope.launch {
                    snackbarHostState.showSnackbar(
                        message = "You’ve finished voting. Your points will be updated when a winner is decided."
                    )
                }
            }
        } catch (t: Throwable) {
            error.value = "Failed to save your vote."
        }
    }
}


