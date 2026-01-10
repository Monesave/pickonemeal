import SwiftUI

struct DiningTablesView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @StateObject private var viewModel = DiningTablesViewModel()
    @State private var showingCreateSheet = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.96, green: 0.95, blue: 0.98)
                    .ignoresSafeArea()

                if viewModel.isLoading {
                    ProgressView("Loading tables…")
                } else if viewModel.tables.isEmpty {
                    VStack(spacing: 12) {
                        Text("No Dining Tables yet")
                            .font(.headline)
                        Text("Create a table to start group voting on meals.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            ForEach(viewModel.tables) { table in
                                NavigationLink(
                                    destination: DiningTableDetailView(tableId: table.id)
                                ) {
                                    DiningTableCard(table: table)
                                }
                            }
                        }
                        .padding(16)
                    }
                }
            }
            .navigationTitle("Dining Tables")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingCreateSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                if let userId = authViewModel.session?.user.id.uuidString {
                    await viewModel.loadTables(userId: userId)
                }
            }
            .sheet(isPresented: $showingCreateSheet) {
                CreateDiningTableSheet { name, date, mealSlot in
                    if let ownerId = authViewModel.session?.user.id.uuidString {
                        Task {
                            await viewModel.createTable(
                                ownerId: ownerId,
                                name: name,
                                date: date,
                                mealSlot: mealSlot
                            )
                        }
                    }
                }
            }
            .alert(
                "Error",
                isPresented: Binding(
                    get: { viewModel.errorMessage != nil },
                    set: { _ in viewModel.errorMessage = nil }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                if let message = viewModel.errorMessage {
                    Text(message)
                }
            }
        }
    }
}

private struct DiningTableCard: View {
    let table: DiningTablesViewModel.TableItem

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(table.name)
                    .font(.subheadline.bold())
                if table.isOwner {
                    Text("Owner")
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(
                            Capsule()
                                .fill(Color.green.opacity(0.15))
                        )
                        .foregroundColor(.green)
                }
            }
            Text("\(table.date) • \(table.mealSlot) • \(table.status)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.04), radius: 8, y: 4)
        )
    }
}

private struct CreateDiningTableSheet: View {
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var date: Date = .init()
    @State private var mealSlot: MealSlot = .dinner

    enum MealSlot: String, CaseIterable, Identifiable {
        case breakfast
        case lunch
        case dinner

        var id: String { rawValue }
        var title: String { rawValue.capitalized }
    }

    let onCreate: (String, String, String) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Table name", text: $name)
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                    Picker("Meal slot", selection: $mealSlot) {
                        ForEach(MealSlot.allCases) { slot in
                            Text(slot.title).tag(slot)
                        }
                    }
                }
            }
            .navigationTitle("Create Dining Table")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        let formatter = DateFormatter()
                        formatter.dateFormat = "yyyy-MM-dd"
                        let isoDate = formatter.string(from: date)
                        onCreate(name, isoDate, mealSlot.rawValue)
                        dismiss()
                    }
                    .disabled(name.isEmpty)
                }
            }
        }
    }
}

