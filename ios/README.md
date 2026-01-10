## iOS App – pickonemeal.com

**⚠️ DEPRECATED: This folder is no longer maintained.**

The application is now web-only. This iOS implementation folder is kept for reference only and will not be deployed to the iOS App Store.

---

## Project structure

Recommended top‑level layout:

- `ios/App/` – Entry point and app composition.
- `ios/Presentation/` – SwiftUI screens and reusable components.
  - `Screens/Onboarding/`
  - `Screens/Home/`
  - `Screens/Swipe/`
  - `Screens/DiningTables/`
  - `Screens/History/`
  - `Screens/Subscription/`
  - `Screens/Profile/`
  - `Components/` – `MealCardView`, `TableHeaderView`, buttons, etc.
- `ios/Domain/` – Domain models and use cases.
  - `Models/`
  - `UseCases/`
- `ios/Data/` – Supabase client, repositories, and local persistence.
  - `API/`
  - `Repositories/`
  - `Persistence/` (optional, for caching/offline).
- `ios/Config/` – Environment configuration and feature flags.

You can create an Xcode project and point its groups to these folders.

---

## Supabase configuration (iOS)

Add your Supabase values to an environment mechanism that is **not committed**:

- Xcode build settings / `.xcconfig`, or
- A secrets manager / CI environment.

Required keys:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

These should match the values used by the Web app.


