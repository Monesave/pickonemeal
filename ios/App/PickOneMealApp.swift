import SwiftUI
import UserNotifications

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            if granted {
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        }
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let tokenParts = deviceToken.map { String(format: "%02.2hhx", $0) }
        let token = tokenParts.joined()
        UserDefaults.standard.set(token, forKey: "apnsDeviceToken")
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for remote notifications:", error)
    }

    // Handle taps on notifications
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        if let tableId = userInfo["table_id"] as? String {
            NotificationCenter.default.post(
                name: .didOpenTableFromNotification,
                object: nil,
                userInfo: ["tableId": tableId]
            )
        } else if let mealId = userInfo["meal_id"] as? String {
            NotificationCenter.default.post(
                name: .didOpenMealFromNotification,
                object: nil,
                userInfo: ["mealId": mealId]
            )
        }

        completionHandler()
    }
}

extension Notification.Name {
    static let didOpenTableFromNotification = Notification.Name("didOpenTableFromNotification")
    static let didOpenMealFromNotification = Notification.Name("didOpenMealFromNotification")
}

@main
struct PickOneMealApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authViewModel)
        }
    }
}


