package com.pickonemeal.ui.screens.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
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
data class PublicProfileStats(
    val id: String,
    @SerialName("display_name") val displayName: String? = null,
    @SerialName("followers_count") val followersCount: Int = 0,
    @SerialName("following_count") val followingCount: Int = 0,
    @SerialName("gamification_points_year") val gamificationPointsYear: Int = 0,
    @SerialName("is_leading_chef") val isLeadingChef: Boolean = false,
    @SerialName("chef_status") val chefStatus: String = "none"
)

@Composable
fun UserProfileScreen(
    userId: String
) {
    val authState = LocalAuthState.current
    val (profile, setProfile) = remember { mutableStateOf<PublicProfileStats?>(null) }
    val (isFollowing, setIsFollowing) = remember { mutableStateOf<Boolean?>(null) }
    val (loading, setLoading) = remember { mutableStateOf(true) }
    val (actionLoading, setActionLoading) = remember { mutableStateOf(false) }
    val (error, setError) = remember { mutableStateOf<String?>(null) }

    val canFollow = authState.session?.sessionOrNull()?.user?.id?.let { it != userId } ?: false

    LaunchedEffect(userId, authState.session) {
        val currentUserId = authState.session?.sessionOrNull()?.user?.id ?: return@LaunchedEffect
        setLoading(true)
        setError(null)

        GlobalScope.launch(Dispatchers.IO) {
            try {
                val client = SupabaseClientProvider.client
                val prof = client
                    .from("profiles")
                    .select("id,display_name,followers_count,following_count,gamification_points_year,is_leading_chef,chef_status")
                    .eq("id", userId)
                    .decodeSingle<PublicProfileStats>()

                val follows = client
                    .from("user_follows")
                    .select("id")
                    .eq("follower_id", currentUserId)
                    .eq("followed_id", userId)
                    .decodeList<Map<String, String>>()

                setProfile(prof)
                setIsFollowing(follows.isNotEmpty())
            } catch (t: Throwable) {
                setError("Unable to load user profile.")
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
        when {
            loading -> {
                CircularProgressIndicator()
            }
            profile != null -> {
                Text(
                    text = profile.displayName ?: "User",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Followers: ${profile.followersCount} • Following: ${profile.followingCount}",
                    style = MaterialTheme.typography.bodySmall
                )
                if (profile.isLeadingChef && profile.chefStatus == "active") {
                    Text(
                        text = "⭐ Leading Chef",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "This year: ${profile.gamificationPointsYear} points",
                    style = MaterialTheme.typography.bodySmall
                )

                Spacer(modifier = Modifier.height(16.dp))

                if (canFollow && isFollowing != null) {
                    Button(
                        enabled = !actionLoading,
                        onClick = {
                            setActionLoading(true)
                            setError(null)
                            val client = SupabaseClientProvider.client
                            GlobalScope.launch(Dispatchers.IO) {
                                try {
                                    if (isFollowing == true) {
                                        client
                                            .rpc(
                                                function = "unfollow_user",
                                                parameters = mapOf("p_followed_id" to userId)
                                            )
                                        setIsFollowing(false)
                                        setProfile(
                                            profile.copy(
                                                followersCount = maxOf(
                                                    profile.followersCount - 1,
                                                    0
                                                )
                                            )
                                        )
                                    } else {
                                        client
                                            .rpc(
                                                function = "follow_user",
                                                parameters = mapOf("p_followed_id" to userId)
                                            )
                                        setIsFollowing(true)
                                        setProfile(
                                            profile.copy(
                                                followersCount = profile.followersCount + 1
                                            )
                                        )
                                    }
                                } catch (t: Throwable) {
                                    setError("Failed to update follow status.")
                                } finally {
                                    setActionLoading(false)
                                }
                            }
                        }
                    ) {
                        Text(text = if (isFollowing == true) "Unfollow" else "Follow")
                    }
                }
            }
            else -> {
                Text(
                    text = "User not found.",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        if (error != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = error, color = MaterialTheme.colorScheme.error)
        }
    }
}


