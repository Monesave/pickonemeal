package com.pickonemeal.ui.screens.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pickonemeal.data.auth.LocalAuthState

@Composable
fun OnboardingScreen(
    onSignedIn: () -> Unit
) {
    val authState = LocalAuthState.current
    val (isSignUp, setIsSignUp) = remember { mutableStateOf(false) }
    val (email, setEmail) = remember { mutableStateOf("") }
    val (password, setPassword) = remember { mutableStateOf("") }
    val (error, setError) = remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(PaddingValues(24.dp)),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = if (isSignUp) "Create account" else "Sign in")

        OutlinedTextField(
            value = email,
            onValueChange = setEmail,
            label = { Text("Email") }
        )
        OutlinedTextField(
            value = password,
            onValueChange = setPassword,
            label = { Text("Password") }
        )

        if (error != null) {
            Text(text = error)
        }

        Button(
            onClick = {
                setError(null)
                if (isSignUp) {
                    authState.signUp(email, password) { throwable ->
                        if (throwable != null) {
                            setError(throwable.message)
                        } else {
                            onSignedIn()
                        }
                    }
                } else {
                    authState.signIn(email, password) { throwable ->
                        if (throwable != null) {
                            setError(throwable.message)
                        } else {
                            onSignedIn()
                        }
                    }
                }
            }
        ) {
            Text(text = if (isSignUp) "Create account" else "Sign in")
        }

        Button(
            onClick = { setIsSignUp(!isSignUp) }
        ) {
            Text(text = if (isSignUp) "Have an account? Sign in" else "Need an account? Sign up")
        }
    }
}


