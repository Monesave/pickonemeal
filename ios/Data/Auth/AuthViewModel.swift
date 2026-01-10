import Foundation
import Supabase

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var session: Session?
    @Published var isLoading: Bool = false

    private let client = SupabaseClientProvider.shared.client

    func bootstrap() async {
        if isLoading { return }
        isLoading = true
        defer { isLoading = false }

        do {
            let sessionResponse = try await client.auth.session
            self.session = sessionResponse
        } catch {
            print("Failed to load session:", error)
            self.session = nil
        }
    }

    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        _ = try await client.auth.signIn(email: email, password: password)
        let sessionResponse = try await client.auth.session
        self.session = sessionResponse
    }

    func signUp(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        _ = try await client.auth.signUp(email: email, password: password)
        let sessionResponse = try await client.auth.session
        self.session = sessionResponse
    }

    func signOut() async {
        isLoading = true
        defer { isLoading = false }

        do {
            try await client.auth.signOut()
            self.session = nil
        } catch {
            print("Failed to sign out:", error)
        }
    }
}


