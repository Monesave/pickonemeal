package com.pickonemeal.ui.screens.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
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
fun HomeScreen(
    onNavigateSwipe: () -> Unit,
    onNavigateTables: () -> Unit,
    onNavigateHistory: () -> Unit,
    onNavigateProfile: () -> Unit
) {
    val authState = LocalAuthState.current
    val repository = remember { PlanningRepository() }
    val isLoading = remember { mutableStateOf(true) }
    val slotStates = remember { mutableStateOf(defaultSlots()) }

    LaunchedEffect(authState.session) {
        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@LaunchedEffect
        isLoading.value = true
        val today = LocalDate.now().toString()

        val slots = withContext(Dispatchers.IO) {
            try {
                repository.loadTodayPlans(userId, today)
            } catch (_: Throwable) {
                emptyList()
            }
        }

        val merged = mergeSlots(slots)
        slotStates.value = merged
        isLoading.value = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Text(text = "Today’s meals")
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "Overview of your Breakfast, Lunch, and Dinner plan for today.")
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading.value) {
            CircularProgressIndicator()
        } else {
            slotStates.value.forEach { slot ->
                Text(text = "${slot.title}: ${slot.statusText}")
                Spacer(modifier = Modifier.height(4.dp))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(onClick = onNavigateSwipe) {
            Text("Plan my meals")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onNavigateTables) {
            Text("Dining Tables")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onNavigateHistory) {
            Text("History")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onNavigateProfile) {
            Text("Profile")
        }
    }
}

private data class SlotSummary(
    val slot: String,
    val title: String,
    val statusText: String
)

private fun defaultSlots(): List<SlotSummary> = listOf(
    SlotSummary("breakfast", "Breakfast", "Not chosen yet. Swipe to pick a meal."),
    SlotSummary("lunch", "Lunch", "Not chosen yet. Swipe to pick a meal."),
    SlotSummary("dinner", "Dinner", "Not chosen yet. Swipe to pick a meal.")
)

private fun mergeSlots(rows: List<PlanningRepository.DailyPlanRow>): List<SlotSummary> {
    val base = defaultSlots().associateBy { it.slot }.toMutableMap()
    rows.forEach { row ->
        val existing = base[row.mealSlot] ?: return@forEach
        val status = when (row.status) {
            "decided" -> {
                val title = row.meals?.title
                if (!title.isNullOrBlank()) "Decided: $title" else "Decided"
            }
            "skipped" -> "Skipped"
            else -> existing.statusText
        }
        base[row.mealSlot] = existing.copy(statusText = status)
    }
    return base.values.toList()
}



