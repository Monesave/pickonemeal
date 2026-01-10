package com.pickonemeal.data.auth

import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import io.github.jan.supabase.gotrue.SessionStatus
import io.github.jan.supabase.gotrue.gotrue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import com.pickonemeal.data.api.SupabaseClientProvider

class AuthStateHolder {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val client = SupabaseClientProvider.client

    var session: SessionStatus? by mutableStateOf(null)
        private set

    init {
        scope.launch {
            client.gotrue.sessionStatus.collectLatest { status ->
                session = status
            }
        }
    }

    fun signIn(email: String, password: String, onResult: (Throwable?) -> Unit) {
        scope.launch {
            try {
                client.gotrue.loginWith(email, password)
                onResult(null)
            } catch (t: Throwable) {
                onResult(t)
            }
        }
    }

    fun signUp(email: String, password: String, onResult: (Throwable?) -> Unit) {
        scope.launch {
            try {
                client.gotrue.signUpWith(email, password)
                onResult(null)
            } catch (t: Throwable) {
                onResult(t)
            }
        }
    }

    fun signOut(onResult: (Throwable?) -> Unit) {
        scope.launch {
            try {
                client.gotrue.logout()
                onResult(null)
            } catch (t: Throwable) {
                onResult(t)
            }
        }
    }
}

val LocalAuthState = compositionLocalOf<AuthStateHolder> {
    error("AuthStateHolder not provided")
}


