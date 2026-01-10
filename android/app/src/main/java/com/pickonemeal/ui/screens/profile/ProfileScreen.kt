package com.pickonemeal.ui.screens.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pickonemeal.data.api.SupabaseClientProvider
import com.pickonemeal.data.auth.LocalAuthState
import com.pickonemeal.data.notifications.NotificationSettings
import com.pickonemeal.data.notifications.NotificationSettingsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProfileStats(
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("followers_count") val followersCount: Int = 0,
    @SerialName("following_count") val followingCount: Int = 0,
    @SerialName("gamification_points_year") val gamificationPointsYear: Int = 0,
    @SerialName("is_leading_chef") val isLeadingChef: Boolean = false,
    @SerialName("chef_status") val chefStatus: String = "none"
)

@Composable
fun ProfileScreen(
    onSignedOut: () -> Unit,
    onNavigateStats: () -> Unit
) {
    val authState = LocalAuthState.current
    val (error, setError) = remember { mutableStateOf<String?>(null) }
    val (stats, setStats) = remember { mutableStateOf<ProfileStats?>(null) }
    val (loading, setLoading) = remember { mutableStateOf(true) }
    val (notificationSettings, setNotificationSettings) = remember { mutableStateOf<NotificationSettings?>(null) }
    val (savingNotifications, setSavingNotifications) = remember { mutableStateOf(false) }

    LaunchedEffect(authState.session) {
        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@LaunchedEffect
        setLoading(true)
        setError(null)
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val client = SupabaseClientProvider.client
                val profile = client
                    .from("profiles")
                    .select("display_name,followers_count,following_count,gamification_points_year,is_leading_chef,chef_status")
                    .eq("id", userId)
                    .decodeSingle<ProfileStats>()
                setStats(profile)

                val settings = NotificationSettingsRepository.fetch(userId)
                setNotificationSettings(settings)
            } catch (t: Throwable) {
                setError("Failed to load profile stats.")
            } finally {
                setLoading(false)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
    ) {
        Text(text = "Profile & settings", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(8.dp))

        when {
            loading -> {
                CircularProgressIndicator()
            }
            stats != null -> {
                Text(
                    text = stats.displayName ?: (authState.session?.sessionOrNull()?.user?.email ?: "Unknown user"),
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "My Points (Gamification): ${stats.gamificationPointsYear} this year",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Followers: ${stats.followersCount} • Following: ${stats.followingCount}",
                    style = MaterialTheme.typography.bodySmall
                )
                if (stats.isLeadingChef && stats.chefStatus == "active") {
                    Text(
                        text = "⭐ Leading Chef",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (notificationSettings != null) {
                    Text(
                        text = "Notifications",
                        style = MaterialTheme.typography.titleSmall
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    NotificationToggleRow(
                        label = "Leading Chef picks meals I follow",
                        checked = notificationSettings.leadingChefPicksEnabled,
                        enabled = !savingNotifications,
                        onCheckedChange = { newValue ->
                            val current = notificationSettings
                            if (current != null) {
                                setSavingNotifications(true)
                                GlobalScope.launch(Dispatchers.IO) {
                                    try {
                                        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@launch
                                        NotificationSettingsRepository.upsert(
                                            userId = userId,
                                            leadingChefPicksEnabled = newValue,
                                            tableWinnerEnabled = current.tableWinnerEnabled
                                        )
                                        setNotificationSettings(
                                            current.copy(leadingChefPicksEnabled = newValue)
                                        )
                                    } catch (t: Throwable) {
                                        // best-effort; you could set an error message here
                                    } finally {
                                        setSavingNotifications(false)
                                    }
                                }
                            }
                        }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    NotificationToggleRow(
                        label = "Dining table I’m in has a winner",
                        checked = notificationSettings.tableWinnerEnabled,
                        enabled = !savingNotifications,
                        onCheckedChange = { newValue ->
                            val current = notificationSettings
                            if (current != null) {
                                setSavingNotifications(true)
                                GlobalScope.launch(Dispatchers.IO) {
                                    try {
                                        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@launch
                                        NotificationSettingsRepository.upsert(
                                            userId = userId,
                                            leadingChefPicksEnabled = current.leadingChefPicksEnabled,
                                            tableWinnerEnabled = newValue
                                        )
                                        setNotificationSettings(
                                            current.copy(tableWinnerEnabled = newValue)
                                        )
                                    } catch (t: Throwable) {
                                        // best-effort; you could set an error message here
                                    } finally {
                                        setSavingNotifications(false)
                                    }
                                }
                            }
                        }
                    )
                }
            }
            else -> {
                Text(
                    text = "Dietary preferences, cuisines, and account settings will live here.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
            onClick = { onNavigateStats() }
        ) {
            Text(text = "View my detailed stats")
        }

        if (error != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = error, color = MaterialTheme.colorScheme.error)
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                setError(null)
                authState.signOut { throwable ->
                    if (throwable != null) {
                        setError(throwable.message)
                    } else {
                        onSignedOut()
                    }
                }
            }
        ) {
            Text(text = "Sign out")
        }
    }
}

@Composable
private fun NotificationToggleRow(
    label: String,
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxSize(),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        androidx.compose.foundation.layout.Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(text = label, style = MaterialTheme.typography.bodySmall)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            enabled = enabled
        )
    }
}


