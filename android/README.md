## Android App – pickonemeal.com

**⚠️ DEPRECATED: This folder is no longer maintained.**

The application is now web-only. This Android implementation folder is kept for reference only and will not be deployed to Google Play Store.

---

## Recommended module & package structure

- `android/app/` – Main Android app module.
  - `src/main/java/com/pickonemeal/`
    - `ui/`
      - `onboarding/`
      - `home/`
      - `swipe/`
      - `tables/`
      - `history/`
      - `profile/`
    - `navigation/` – Nav graph + route constants.
    - `domain/` – Domain models and use cases.
    - `data/`
      - `remote/` – Supabase API access.
      - `repository/` – Repository interfaces/impl.
      - `local/` – Room DB / DataStore (optional).
    - `common/` – Design system, theme, and utilities.

---

## Supabase configuration (Android)

Supabase values should be provided via **build-time configuration**, not hard‑coded:

- Add the following to `local.properties` or your CI environment:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- Expose them to code via `build.gradle`:

```kotlin
// app/build.gradle.kts (example)
android {
    defaultConfig {
        buildConfigField("String", "SUPABASE_URL", "\"${project.property("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${project.property("SUPABASE_ANON_KEY")}\"")
    }
}
```

Then reference them from code as `BuildConfig.SUPABASE_URL` and `BuildConfig.SUPABASE_ANON_KEY`.


