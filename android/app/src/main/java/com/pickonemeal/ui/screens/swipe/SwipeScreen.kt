package com.pickonemeal.ui.screens.swipe

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pickonemeal.data.auth.LocalAuthState
import com.pickonemeal.data.planning.PlanningRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate

@Composable
fun SwipeScreen() {
    val authState = LocalAuthState.current
    val repository = remember { PlanningRepository() }
    val isLoading = remember { mutableStateOf(true) }
    val error = remember { mutableStateOf<String?>(null) }
    val meals = remember { mutableStateOf<List<PlanningRepository.MealRow>>(emptyList()) }
    val currentIndex = remember { mutableStateOf(0) }
    val swipeCount = remember { mutableStateOf(0) }
    val selectedSlot = remember { mutableStateOf("dinner") }
    val dailyLimit = 3

    val remaining = dailyLimit - swipeCount.value
    val currentMeal = meals.value.getOrNull(currentIndex.value)

    LaunchedEffect(authState.session) {
        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@LaunchedEffect
        isLoading.value = true
        error.value = null
        val today = LocalDate.now().toString()

        try {
            val counter = withContext(Dispatchers.IO) {
                repository.loadSwipeCounter(userId, today)
            }
            val loadedMeals = withContext(Dispatchers.IO) {
                repository.loadMeals()
            }
            swipeCount.value = counter
            meals.value = loadedMeals
            currentIndex.value = 0
        } catch (t: Throwable) {
            error.value = "Failed to load meals."
        } finally {
            isLoading.value = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Text(text = "Swipe meals")
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = "Plan your solo meals for today. You can choose up to 3 meals per day.")
        Spacer(modifier = Modifier.height(16.dp))

        Text(text = "Meal slot:")
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedTextField(
            value = selectedSlot.value,
            onValueChange = { selectedSlot.value = it },
            label = { Text("Slot (breakfast, lunch, dinner)") }
        )

        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Remaining today: ${if (remaining < 0) 0 else remaining}"
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading.value) {
            CircularProgressIndicator()
        } else if (currentMeal == null) {
            Text(text = "No more meals to show right now. Try again later.")
        } else {
            Text(text = currentMeal.title)
            currentMeal.description?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = it)
            }
            currentMeal.prepTimeMinutes?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = "Prep time: $it min")
            }

            Spacer(modifier = Modifier.height(16.dp))

            Column {
                OutlinedButton(onClick = {
                    handleDecision(
                        decision = "dislike",
                        remaining = remaining,
                        authState = authState,
                        repository = repository,
                        selectedSlot = selectedSlot.value,
                        swipeCount = swipeCount,
                        currentIndex = currentIndex,
                        meals = meals,
                        error = error
                    )
                }) {
                    Text("Dislike")
                }
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedButton(onClick = {
                    handleDecision(
                        decision = "skip",
                        remaining = remaining,
                        authState = authState,
                        repository = repository,
                        selectedSlot = selectedSlot.value,
                        swipeCount = swipeCount,
                        currentIndex = currentIndex,
                        meals = meals,
                        error = error
                    )
                }) {
                    Text("Skip")
                }
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    enabled = remaining > 0,
                    onClick = {
                        handleDecision(
                            decision = "like",
                            remaining = remaining,
                            authState = authState,
                            repository = repository,
                            selectedSlot = selectedSlot.value,
                            swipeCount = swipeCount,
                            currentIndex = currentIndex,
                            meals = meals,
                            error = error
                        )
                    }
                ) {
                    Text(if (remaining > 0) "Like & plan" else "Limit reached")
                }
            }
        }

        error.value?.let {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = it)
        }
    }
}

private fun handleDecision(
    decision: String,
    remaining: Int,
    authState: com.pickonemeal.data.auth.AuthStateHolder,
    repository: PlanningRepository,
    selectedSlot: String,
    swipeCount: androidx.compose.runtime.MutableState<Int>,
    currentIndex: androidx.compose.runtime.MutableState<Int>,
    meals: androidx.compose.runtime.MutableState<List<PlanningRepository.MealRow>>,
    error: androidx.compose.runtime.MutableState<String?>
) {
    val userId = authState.session?.sessionOrNull()?.user?.id ?: return
    val today = LocalDate.now().toString()
    if (decision == "like" && remaining <= 0) return

    val meal = meals.value.getOrNull(currentIndex.value) ?: return

    val status = when (decision) {
        "like" -> "decided"
        "skip" -> "skipped"
        else -> "none"
    }
    val mealId = if (decision == "like") meal.id else null

    authState.signIn("","") { } // placeholder to keep scope; actual work is below

    kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
        try {
            repository.upsertDailyPlan(
                userId = userId,
                isoDate = today,
                mealSlot = selectedSlot,
                status = status,
                mealId = mealId
            )
            if (decision == "like") {
                val updated = repository.upsertSwipeCounter(
                    userId = userId,
                    isoDate = today,
                    value = swipeCount.value + 1
                )
                swipeCount.value = updated
            }
            if (currentIndex.value + 1 < meals.value.size) {
                currentIndex.value = currentIndex.value + 1
            }
        } catch (t: Throwable) {
            error.value = "Failed to save your choice."
        }
    }
}



