import Foundation
import Supabase

enum EnvironmentConfig {
    static var supabaseURL: URL {
        // Replace with your configuration mechanism (e.g. Info.plist / xcconfig)
        URL(string: "https://your-project-id.supabase.co")!
    }

    static var supabaseAnonKey: String {
        // Replace with your anon key from Supabase; do not commit real secrets.
        "your-public-anon-key"
    }
}

final class SupabaseClientProvider {
    static let shared = SupabaseClientProvider()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: EnvironmentConfig.supabaseURL,
            supabaseKey: EnvironmentConfig.supabaseAnonKey
        )
    }
}


