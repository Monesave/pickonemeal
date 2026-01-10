import SwiftUI

struct AppShellView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    enum Tab {
        case home
        case swipe
        case tables
        case history
        case profile
    }

    @State private var selectedTab: Tab = .home

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house")
                }
                .tag(Tab.home)

            SwipeView()
                .tabItem {
                    Label("Swipe", systemImage: "hand.draw")
                }
                .tag(Tab.swipe)

            DiningTablesView()
                .tabItem {
                    Label("Tables", systemImage: "table")
                }
                .tag(Tab.tables)

            HistoryView()
                .tabItem {
                    Label("History", systemImage: "clock.arrow.circlepath")
                }
                .tag(Tab.history)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
                .tag(Tab.profile)
        }
    }
}


