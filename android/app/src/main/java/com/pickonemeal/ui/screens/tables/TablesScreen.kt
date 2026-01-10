package com.pickonemeal.ui.screens.tables

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.material3.icons.Icons
import androidx.compose.material3.icons.filled.Add
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.pickonemeal.data.auth.LocalAuthState
import com.pickonemeal.data.dining.DiningTableRow
import com.pickonemeal.data.dining.DiningTablesRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.time.LocalDate

data class TableItem(
    val id: String,
    val name: String,
    val date: String,
    val mealSlot: String,
    val status: String,
    val isOwner: Boolean
)

@Composable
fun TablesScreen(
    onOpenTable: (String) -> Unit = {}
) {
    val authState = LocalAuthState.current
    val repository = remember { DiningTablesRepository() }
    val isLoading = remember { mutableStateOf(true) }
    val error = remember { mutableStateOf<String?>(null) }
    val tables = remember { mutableStateOf<List<TableItem>>(emptyList()) }
    val showCreate = remember { mutableStateOf(false) }

    LaunchedEffect(authState.session) {
        val userId = authState.session?.sessionOrNull()?.user?.id ?: return@LaunchedEffect
        isLoading.value = true
        error.value = null

        try {
            val rows = repository.fetchTables(userId)
            tables.value = rows.map {
                TableItem(
                    id = it.id,
                    name = it.name,
                    date = it.date,
                    mealSlot = it.mealSlot,
                    status = it.status,
                    isOwner = it.ownerId == userId
                )
            }
        } catch (t: Throwable) {
            error.value = "Failed to load tables."
        } finally {
            isLoading.value = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Dining Tables") },
                actions = {
                    IconButton(onClick = { showCreate.value = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Create table")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate.value = true }) {
                Icon(Icons.Default.Add, contentDescription = "Create table")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            if (isLoading.value) {
                CircularProgressIndicator()
            } else if (tables.value.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(text = "No Dining Tables yet", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Create a table to start group voting on meals.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                LazyColumn {
                    items(tables.value) { table ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onOpenTable(table.id) }
                                .padding(vertical = 8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = table.name)
                                if (table.isOwner) {
                                    Text(
                                        text = "Owner",
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                            Text(
                                text = "${table.date} • ${table.mealSlot} • ${table.status}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }

            error.value?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = it, color = MaterialTheme.colorScheme.error)
            }
        }

        if (showCreate.value) {
            CreateTableDialog(
                onDismiss = { showCreate.value = false },
                onCreate = { name, date, slot ->
                    val userId = authState.session?.sessionOrNull()?.user?.id ?: return@CreateTableDialog
                    GlobalScope.launch(Dispatchers.IO) {
                        try {
                            val created = repository.createTable(userId, name, date, slot)
                            val item = TableItem(
                                id = created.id,
                                name = created.name,
                                date = created.date,
                                mealSlot = created.mealSlot,
                                status = created.status,
                                isOwner = true
                            )
                            tables.value = listOf(item) + tables.value
                        } catch (t: Throwable) {
                            error.value = "Failed to create table."
                        }
                    }
                    showCreate.value = false
                }
            )
        }
    }
}

@Composable
private fun CreateTableDialog(
    onDismiss: () -> Unit,
    onCreate: (String, String, String) -> Unit
) {
    val name = remember { mutableStateOf("") }
    val slot = remember { mutableStateOf("dinner") }
    val today = LocalDate.now().toString()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Dining Table") },
        text = {
            Column {
                OutlinedTextField(
                    value = name.value,
                    onValueChange = { name.value = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = today,
                    onValueChange = { },
                    enabled = false,
                    label = { Text("Date") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = slot.value,
                    onValueChange = { slot.value = it },
                    label = { Text("Meal slot (breakfast/lunch/dinner)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onCreate(name.value, today, slot.value)
                },
                enabled = name.value.isNotBlank()
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

