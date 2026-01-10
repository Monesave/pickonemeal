import SwiftUI

struct HistoryView: View {
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Meal history")
                    .font(.title2.bold())
                Text("This will show your personal and table meal history.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding()
            .navigationTitle("History")
        }
    }
}


