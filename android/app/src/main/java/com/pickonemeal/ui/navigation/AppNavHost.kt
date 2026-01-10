package com.pickonemeal.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.pickonemeal.data.auth.LocalAuthState
import com.pickonemeal.ui.screens.home.HomeScreen
import com.pickonemeal.ui.screens.onboarding.OnboardingScreen
import com.pickonemeal.ui.screens.swipe.SwipeScreen
import com.pickonemeal.ui.screens.tables.TablesScreen
import com.pickonemeal.ui.screens.history.HistoryScreen
import com.pickonemeal.ui.screens.profile.ProfileScreen
import com.pickonemeal.ui.screens.profile.StatsScreen
import com.pickonemeal.ui.screens.tables.TableDetailScreen
import com.pickonemeal.ui.screens.tables.RoundScreen

object Routes {
    const val ONBOARDING = "onboarding"
    const val HOME = "home"
    const val SWIPE = "swipe"
    const val TABLES = "tables"
    const val TABLE_DETAIL = "table"
    const val ROUND = "round"
    const val HISTORY = "history"
    const val PROFILE = "profile"
    const val STATS = "stats"
}

@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    startTableId: String? = null,
    startInviteToken: String? = null,
    startMealId: String? = null
) {
    val authState = LocalAuthState.current
    val startDestination =
        if (authState.session == null) {
            Routes.ONBOARDING
        } else if (startTableId != null) {
            "${Routes.TABLE_DETAIL}/${startTableId}"
        } else {
            Routes.HOME
        }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Routes.ONBOARDING) {
            OnboardingScreen(
                onSignedIn = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.ONBOARDING) { inclusive = true }
                    }
                }
            )
        }
        composable(Routes.HOME) {
            HomeScreen(
                onNavigateSwipe = { navController.navigate(Routes.SWIPE) },
                onNavigateTables = { navController.navigate(Routes.TABLES) },
                onNavigateHistory = { navController.navigate(Routes.HISTORY) },
                onNavigateProfile = { navController.navigate(Routes.PROFILE) }
            )
        }
        composable(Routes.SWIPE) {
            SwipeScreen()
        }
        composable(Routes.TABLES) {
            TablesScreen(
                onOpenTable = { tableId ->
                    navController.navigate("${Routes.TABLE_DETAIL}/$tableId")
                }
            )
        }
        composable(
            route = "${Routes.TABLE_DETAIL}/{id}",
            arguments = listOf(
                navArgument("id") { type = NavType.StringType },
                navArgument("token") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            ),
            deepLinks = listOf(
                navDeepLink {
                    uriPattern = "https://pickonemeal.com/table/{id}?token={token}"
                }
            )
        ) { backStackEntry ->
            val tableId = backStackEntry.arguments?.getString("id") ?: return@composable
            val token = backStackEntry.arguments?.getString("token")
            TableDetailScreen(
                tableId = tableId,
                inviteToken = token
            )
        }
        composable(
            route = "${Routes.ROUND}/{tableId}/{roundId}",
            arguments = listOf(
                navArgument("tableId") { type = NavType.StringType },
                navArgument("roundId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val tableId = backStackEntry.arguments?.getString("tableId") ?: return@composable
            val roundId = backStackEntry.arguments?.getString("roundId") ?: return@composable
            RoundScreen(tableId = tableId, roundId = roundId)
        }
        composable(Routes.HISTORY) {
            HistoryScreen()
        }
        composable(Routes.PROFILE) {
            ProfileScreen(
                onSignedOut = {
                    navController.navigate(Routes.ONBOARDING) {
                        popUpTo(0)
                    }
                },
                onNavigateStats = {
                    navController.navigate(Routes.STATS)
                }
            )
        }
        composable(Routes.STATS) {
            StatsScreen()
        }
    }
}


