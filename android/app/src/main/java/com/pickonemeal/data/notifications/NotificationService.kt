package com.pickonemeal.data.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.pickonemeal.MainActivity
import com.pickonemeal.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NotificationService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)

        // Best-effort: we don't have auth here, so store locally; the app layer can push this later
        getSharedPreferences("notifications", Context.MODE_PRIVATE)
            .edit()
            .putString("fcm_token", token)
            .apply()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val type = message.data["type"] ?: return
        val title = message.notification?.title ?: "PickOneMeal"
        val body = message.notification?.body ?: ""

        when (type) {
            "leading_chef_pick" -> {
                showNotification(
                    id = 1001,
                    title = title,
                    body = body,
                    destination = Destination.LeadingChefPick(
                        chefId = message.data["chef_id"],
                        mealId = message.data["meal_id"]
                    )
                )
            }
            "table_winner" -> {
                showNotification(
                    id = 1002,
                    title = title,
                    body = body,
                    destination = Destination.TableWinner(
                        tableId = message.data["table_id"]
                    )
                )
            }
        }
    }

    private fun showNotification(
        id: Int,
        title: String,
        body: String,
        destination: Destination
    ) {
        createChannelIfNeeded()

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            when (destination) {
                is Destination.TableWinner -> {
                    putExtra("start_table_id", destination.tableId)
                }
                is Destination.LeadingChefPick -> {
                    putExtra("start_meal_id", destination.mealId)
                    putExtra("start_chef_id", destination.chefId)
                }
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        with(NotificationManagerCompat.from(this)) {
            notify(id, notification)
        }
    }

    private fun createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "PickOneMeal",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    sealed class Destination {
        data class LeadingChefPick(val chefId: String?, val mealId: String?) : Destination()
        data class TableWinner(val tableId: String?) : Destination()
    }

    companion object {
        private const val CHANNEL_ID = "pickonemeal_default"

        /**
         * Call from app layer after login to sync the token to Supabase.
         */
        fun syncTokenWithBackend(context: Context, userId: String) {
            val prefs = context.getSharedPreferences("notifications", Context.MODE_PRIVATE)
            val token = prefs.getString("fcm_token", null) ?: return

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    NotificationSettingsRepository.updateFcmToken(userId, token)
                } catch (_: Throwable) {
                }
            }
        }
    }
}


