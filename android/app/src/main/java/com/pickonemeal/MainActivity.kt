package com.pickonemeal

import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val startTableId: String?
        val startToken: String?
        val startMealId: String?

        val data: Uri? = intent?.data
        if (data != null && data.pathSegments.firstOrNull() == "table") {
            startTableId = data.pathSegments.getOrNull(1)
            startToken = data.getQueryParameter("token")
            startMealId = null
        } else {
            // Check extras (notifications)
            startTableId = intent?.getStringExtra("start_table_id")
            startMealId = intent?.getStringExtra("start_meal_id")
            startToken = null
        }

        setContent {
            PickOneMealApp(
                startTableId = startTableId,
                startInviteToken = startToken,
                startMealId = startMealId
            )
        }
    }
}

