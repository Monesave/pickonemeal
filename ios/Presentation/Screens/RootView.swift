import SwiftUI

struct RootView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    var body: some View {
        Group {
            if authViewModel.isLoading {
                ProgressView("Loading…")
            } else if authViewModel.session == nil {
                OnboardingView()
            } else {
                AppShellView()
            }
        }
        .task {
            await authViewModel.bootstrap()
        }
    }
}


