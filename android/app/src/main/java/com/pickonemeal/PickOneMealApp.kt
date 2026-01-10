package com.pickonemeal

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import com.pickonemeal.ui.navigation.AppNavHost
import com.pickonemeal.ui.theme.PickOneMealTheme
import com.pickonemeal.data.auth.AuthStateHolder
import com.pickonemeal.data.auth.LocalAuthState
import com.pickonemeal.data.notifications.NotificationService

@Composable
fun PickOneMealApp(
    startTableId: String? = null,
    startInviteToken: String? = null,
    startMealId: String? = null
) {
    PickOneMealTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            val authState = remember { AuthStateHolder() }
            val context = LocalContext.current

            CompositionLocalProvider(LocalAuthState provides authState) {
                LaunchedEffect(authState.session) {
                    val userId = authState.session?.sessionOrNull()?.user?.id
                    if (userId != null) {
                        NotificationService.syncTokenWithBackend(context, userId)
                    }
                }

                AppNavHost(
                    startTableId = startTableId,
                    startInviteToken = startInviteToken,
                    startMealId = startMealId
                )
            }
        }
    }
}


