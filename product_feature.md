## pickonemeal.com – Product & Flow Specification

**Tagline (example):** “Swipe together. Decide dinner fast.”

**Platform:** Web (responsive)

This document specifies the core product, user flows, app logic, subscription rules, dining group mechanics, and data requirements for **pickonemeal.com**. It is intended for engineers and designers working on the web application.

---

## 1. Core Concept

**pickonemeal.com** is a Tinder-style app for **home-made meal selection** for couples, families, and small groups.

Users can:

- **Swipe through meal cards** with like / dislike / skip.
- **Plan their own meals solo** (always free).
- **Join or create a Dining Table** to vote on meals together.
- **Confirm a meal** only when all participants like the same one.

If there’s no consensus:

- Show **runner-up meals**, and/or
- Start another **revote round**.

If no meal is decided within **1 hour**, the app automatically picks:

- A random meal from the current round’s liked / candidate choices, **or**
- A random meal from the last **3 previously chosen meals** for that table.

Each user can select **up to 3 meals per day**.  
Participants can explicitly choose to **skip a meal**.

---

## 2. Monetisation & Access

### 2.1 Free Tier (Default)

Free users can:

- **Swipe** like / dislike / skip meals.
- **Plan daily meals for themselves** (solo planning).
- **Join Dining Tables** via invite link.
- **Participate fully** in all group voting rounds.

Free users **cannot**:

- Create Dining Tables.
- View the 1‑month group meal history.

### 2.2 Subscription (Dining Table Creator)

**Price:** **£1.99 / month** (1.99 GBP / month)

Subscribers can:

- **Create Dining Tables** and invite family and friends.
- Unlock **1‑month Dining Table meal history**:
  - All participants in that table can view it, even if they are free users.
- **Close/archive** tables they own.

**Notes:**

- Only the **Dining Table owner** needs an active subscription.
- **Joining a table is always free.**

---

## 3. User Types

### Free User

- Solo meal planning only.
- Can join existing Dining Tables.
- Cannot create Dining Tables.
- No extended group history (beyond what table owners expose).

### Subscriber

- All Free User features.
- Can **create** Dining Tables.
- Enables **1‑month history** for all participants in their tables.

---

## 4. Navigation Structure

Primary navigation sections:

1. **Onboarding & Authentication**
2. **Home Dashboard**
3. **Swipe**
4. **Dining Tables** (My Tables / Joined Tables)
5. **Meal History**
6. **Subscription Paywall**
7. **Profile & Settings**

---

## 5. User Flows

### 5.1 Onboarding & Authentication

#### 5.1.1 First Launch

**Splash Screen**

- pickonemeal.com logo + tagline.

**Intro Screens (optional carousel):**

1. “Swipe delicious meals.”
2. “Create a Dining Table for family decisions.”
3. “Swipe together. Eat together.”

**Account Creation:**

- Email + password.
- Sign in with Apple.
- Sign in with Google.
- Optional **guest mode** (limited sync, local-only until upgrade).

**Optional Setup:**

- Dietary preferences (e.g. vegan, gluten-free, halal).
- Cuisine preferences.

---

### 5.2 Home Screen

The Home screen shows:

- **Today’s Meal Summary**
  - Breakfast / Lunch / Dinner.
  - Status per slot:
    - **Decided** (winner meal).
    - **In progress** (Dining Table voting).
    - **Not chosen yet**.

- **Quick Actions**
  - “Plan My Meals” (solo planning).
  - “My Dining Tables” (for subscribers).
  - “Tables I’ve Joined”.

- **Subscription Banner** (visible to free users)
  - “Create Dining Tables & unlock 1‑month history – £1.99/month”.

---

### 5.3 Meal Swiping

Used for both **solo planning** and **group decision‑making**.

#### 5.3.1 Meal Card UI

Each meal card includes:

- Meal image.
- Meal title.
- Cuisine and dietary tags.
- Prep time.
- Short description.

#### 5.3.2 Swipe Mechanics

- **Swipe Right → Like**.
- **Swipe Left → Dislike**.
- **Swipe Down → Skip meal**.
- Tap card to view detailed information (optional).

**Daily Limit: Up to 3 meals per day.**

- If user tries to add more:
  - Show message: “You’ve reached your 3‑meal limit today.”

---

### 5.4 Solo Meal Planning (Free)

#### 5.4.1 Select Meal Slot

User chooses a target slot:

- Breakfast.
- Lunch.
- Dinner.

#### 5.4.2 Swipe & Assign

- **Like** a meal → assigned to the selected slot.
- **Skip** → marks the slot as **skipped** for that meal/time.
- **Dislike** → hides that meal from suggestions for the day (for that user).

#### 5.4.3 Storage

The chosen meal is saved to:

- **Today’s Plan**.
- A **personal mini‑history** (e.g. last few days only, exact range TBD).

---

### 5.5 Dining Tables (Group Voting)

#### 5.5.1 Dining Table List

Sections:

- **My Dining Tables** (subscriber‑only).
- **Tables I’ve Joined** (available to everyone).

Each table item shows:

- Table name (e.g. “Friday Family Dinner”).
- Owner.
- Meal slot (Breakfast / Lunch / Dinner).
- Status:
  - Not started.
  - Active voting.
  - Winner found.
  - Revote needed.
  - Auto‑picked (timeout).

---

#### 5.5.2 Creating a Dining Table (Subscriber Only)

If a non‑subscriber taps **Create Dining Table**, show the subscription paywall.

**Creation Form:**

- Table name.
- Date.
- Meal slot (Breakfast / Lunch / Dinner).
- Dietary settings (optional; can pre‑filter meals).

**After creation:**

- Auto‑generate an invite link:
  - `https://pickonemeal.com/table/<tableId>?token=<inviteToken>`
- Navigate to the **Dining Table Detail** page.
- Show a primary **“Share Invite”** button.

---

#### 5.5.3 Joining a Dining Table

Flow for invitees:

- User opens the invite link.
- If logged out:
  - Prompt login / sign up.
  - After auth, resume join flow.
- Backend attaches user to the table’s **participant list**.
- User is navigated to the **Dining Table Detail** screen for that table.

---

#### 5.5.4 Dining Table Detail Screen

Sections:

1. **Table Header**
   - Name, date, meal slot, owner.
2. **Participants**
   - Avatars, basic status (e.g. “voting”, “waiting”, “skipped”).
3. **Current Round**
   - “Round 1 started” (or relevant round number).
   - “Vote before 7:00 PM” (deadline).
   - “Decision deadline: 1 hour” (relative timer / countdown).
4. **Actions**
   - **Start Round** (owner only, when idle).
   - **End Round / Force Decision** (owner only).
   - **Start Voting** (participants).
   - **Skip Meal** (participant chooses to opt‑out of that meal decision).
5. **History (if owner has subscription)**
   - “Meals decided this month”.
   - List of winner meals with dates and basic metadata.

---

### 5.6 Voting Rounds

#### 5.6.1 Starting a Round

When the owner taps **Start Round**:

- Backend selects a batch of **10–20 meals** (rules TBD: random, preferences, history‑aware).
- Backend creates:
  - `roundId`.
  - 1‑hour countdown timer.
- Table status is set to `active`.

---

#### 5.6.2 Participant Voting (Swiping)

During an active round, each participant:

- Swipes **Like / Dislike / Skip** on each candidate meal, **or**
- Explicitly chooses **“Skip this meal”** to opt‑out of the decision.

Votes are sent to the backend in a structure such as:

```json
{
  "tableId": "<table-id>",
  "roundId": "<round-id>",
  "mealId": "<meal-id>",
  "userId": "<user-id>",
  "vote": "like" | "dislike" | "skip"
}
```

---

## 6. Gamification & “Leading Chef” Program (New)

### 6.1 Dining Table Gamification

#### 6.1.1 Goals

- Reward users who **suggest and win** meals in a Dining Table.
- Encourage ongoing participation (e.g. **yearly “season”**).
- Provide a small celebratory moment whenever a group agrees on a meal.

#### 6.1.2 Points System (Per-User, Per-Season)

- **Scope**
  - Points are tracked **per user** and per **Dining Table season** (default: calendar year).
  - Points reset each year, but historical totals are kept for archives/achievements.

- **Meal Winner Points**
  - When a meal becomes the **winner** for a Dining Table round:
    - All participants who:
      - Voted **Like** on that winning meal, and
      - Did **not skip** that meal
    - Receive **+10 points**.

- **Early Suggestion Bonus (optional)**
  - If the winning meal appeared among a user’s **first X likes** in a day (e.g. first 5 likes):
    - That user gets an additional **+5 bonus points**.

- **Participation Points (optional)**
  - For each completed voting round where a user swipes all assigned cards or explicitly skips:
    - Award **+1 point** for participation, even if their choice doesn’t win.
  - Cap participation points per day (e.g. max **5 points/day**) to avoid farming.

- **Auto-picked Meals**
  - If a meal is **auto-picked** due to timeout:
    - Only users who **liked** that meal receive **+5 points** (reduced reward).
    - No participation bonus if nobody swiped.

- **Skipping at Table Level**
  - If a user chooses **“Skip this meal”** at the table level:
    - They are excluded from scoring and from consensus checks for that round.

#### 6.1.3 Winner Feedback – Confetti & Points Toast

When a meal is **agreed upon** (winner decided by consensus or majority, not auto-pick):

- **Confetti Animation**
  - Short, full-screen confetti (approx. 0.8–1.2 seconds).
  - Triggered on all clients viewing that table when backend marks the winner.

- **Points Toast**
  - After confetti, show a toast/banner:
    - “You earned **+10 points** for this meal!”
  - If bonus applies:
    - “You earned **+15 points** (winner + suggestion bonus).”

For **auto-picked meals**:

- Use a smaller animation (e.g. subtle highlight) or no confetti.
- Toast: “Meal auto-picked. You earned +5 points.”

#### 6.1.4 Dining Table Detail – Points Summary

UI adjustments on Dining Table detail:

- Under the table header, show a **points summary** for the current user:
  - “This year: **X total points**”
- Optional MVP extension: per-table mini leaderboard (e.g. “Top 3 this year”).
- Add a link/button: **“View My Stats”** → navigates to the Profile / Stats section.

#### 6.1.5 Profile – Gamification Stats

New section on the **Profile** screen:

- **Current Season Points**
  - Prominent display, e.g. “1,240 points this year”.
- **Breakdown**
  - “Meals won: 34”
  - “Participation rounds: 90”
- Future: basic badges (e.g. “Top 10% for this table this year”), using same data.

---

### 6.2 “Leading Chef” Program

#### 6.2.1 Concept

Introduce a **creator-like role**:

- **Leading Chef** = user who:
  1. Has an **active Premium subscription**, and
  2. Has **≥ 1000 followers**.

Leading Chefs:

- Can earn **Reward Points** convertible into **vouchers**.
- Their followers get notifications when the Chef selects a new meal (solo or table winner).

> **Note:** Leading Chef **Reward Points** are distinct from regular gamification points:
> - **Gamification points** = fun points for all users (per table season).
> - **Reward Points** = monetizable points for Leading Chefs only.

#### 6.2.2 Follow System

- Any user can **follow** any other user.
- Only users meeting the criteria become **Leading Chefs** and gain rewards.

**Profile UI:**

- Show:
  - Avatar, name, optional short bio.
  - “Followers: X – Following: Y”.
- Buttons:
  - “Follow” / “Unfollow”.
- If user is a Leading Chef:
  - Show **“⭐ Leading Chef”** badge.

Optional future:

- Simple **Leading Chef discovery screen** listing featured chefs.

#### 6.2.3 Becoming / Losing Leading Chef Status

- **Eligibility:**
  - `isSubscribed == true` (active Premium).
  - `followersCount >= 1000`.

- When conditions are met:
  - Backend sets `isLeadingChef = true` and `chefStatus = "active"`.
  - UI shows onboarding tooltip:
    - “You’re now a Leading Chef! Earn reward points when your followers engage with your meal decisions.”

- If subscription lapses or followers drop below threshold:
  - Backend sets `isLeadingChef = false` or `chefStatus = "inactive"`.
  - Rewards already earned remain, but **no new Reward Points** accumulate.

#### 6.2.4 Reward Points & Vouchers

- **Reward Earning (conceptual)**
  - When a **Leading Chef** selects or wins a meal (solo or Dining Table they own):
    - For each follower who:
      - Receives the Chef’s meal notification, and
      - **Interacts** (opens app / views meal / joins table),
    - Chef earns **Reward Points** (e.g. +1 per engaged follower, with daily caps).
  - Requires event tracking of follower engagement and server-side aggregation.

- **Rewards UI (Profile – Leading Chef only)**
  - Section: **“Chef Rewards”**
    - “Reward balance: X points”.
    - CTA: **“Redeem voucher”**.
  - History:
    - List of reward accrual events and voucher redemptions.

- **Voucher Conversion (high-level)**
  - Backend defines conversion (e.g. `1000 Reward Points = £10 voucher`).
  - When user taps “Redeem voucher”:
    - Show available voucher options.
    - On confirmation:
      - Create a **Voucher** object (code/link).
      - Deduct Reward Points.

#### 6.2.5 Notifications for Followers

When a **Leading Chef** chooses a new meal:

- Either:
  - A **solo meal** they pick for themselves, or
  - A **Dining Table winner** where they are the owner or key participant,

Then:

- Followers receive a notification, e.g.:
  - Title: “Chef Alex picked tonight’s dinner”.
  - Body: “They’re having Spicy Tofu Stir Fry. Tap to see recipe.”

Client behavior:

- Tapping the notification opens:
  - The meal detail screen (for solo decisions), or
  - The Dining Table result (for group decisions).
- Followers can:
  - Add that meal to their own plan, or
  - Start a new Dining Table using that meal as a candidate.

#### 6.2.6 Notification Settings

In user **Settings**:

- Add toggles:
  - “Notify me when a Leading Chef I follow picks a new meal.”
  - “Notify me when a Dining Table I’m in has a winner.”

---

## 7. Additional Database Changes for Gamification & Leading Chef

### 7.1 User (extend existing)

Add fields to the existing `users`/`profiles` model (depending on implementation):

```text
User
- id
- email
- name
- avatarUrl
- isSubscribed (existing)
- subscriptionExpiresAt (existing)
- followersCount (NEW, cached)
- followingCount (NEW, cached)
- isLeadingChef (NEW, bool)
- chefStatus (NEW, enum: "none" | "active" | "inactive")
- gamificationPointsYear (NEW, int – current season total)
- createdAt
```

Additional new tables (to be fully specified in the Supabase schema):

- **`user_follows`**
  - Tracks `follower_id` → `followed_id`, with timestamps.
  - Used to compute `followersCount` / `followingCount` and determine `isLeadingChef`.

- **`gamification_points`**
  - Per user, per season, per table (or per scope), storing:
    - total points, meals won, participation counts, etc.

- **`chef_rewards`**
  - Reward Points ledger for Leading Chefs:
    - `chef_id`, `change_amount`, `reason`, `created_at`.

- **`vouchers`**
  - Voucher inventory and redemptions:
    - `id`, `chef_id`, `code`, `value`, `status`, `created_at`, `redeemed_at`.

Exact schema details for these new tables should align with Supabase (`supabase_schema.sql`) and backend functions (`supabase_functions.sql`).

---

## 6. Database Schema

Relational database (e.g. Postgres) with strong referential integrity and indexes on all foreign keys and frequently queried fields (e.g. `user_id`, `table_id`, `round_id`, `created_at`).

### 6.1 Core User & Auth Tables

**Table: `users`**

| Column              | Type              | Notes                                              |
|---------------------|-------------------|----------------------------------------------------|
| `id` (PK)           | UUID              | Primary key                                        |
| `email`             | VARCHAR(255)      | Unique, nullable for guest users                   |
| `email_normalized`  | VARCHAR(255)      | Lowercased, unique index                           |
| `password_hash`     | TEXT              | Nullable if using SSO only                         |
| `display_name`      | VARCHAR(100)      | Public name                                        |
| `avatar_url`        | TEXT              | Optional                                           |
| `is_guest`          | BOOLEAN           | Default `false`                                    |
| `created_at`        | TIMESTAMP         | Default `NOW()`                                    |
| `updated_at`        | TIMESTAMP         | Auto-updated                                       |
| `deleted_at`        | TIMESTAMP         | Soft delete                                        |

**Table: `auth_providers`**

| Column              | Type         | Notes                                      |
|---------------------|-------------|--------------------------------------------|
| `id` (PK)           | UUID        | Primary key                                |
| `user_id` (FK)      | UUID        | → `users.id`                               |
| `provider`          | VARCHAR(50) | `apple`, `google`, etc.                    |
| `provider_user_id`  | VARCHAR(255)| Provider-specific user ID (indexed, unique)|
| `created_at`        | TIMESTAMP   |                                            |

### 6.2 Subscription & Billing

**Table: `subscriptions`**

| Column                 | Type         | Notes                                                  |
|------------------------|-------------|--------------------------------------------------------|
| `id` (PK)              | UUID        | Primary key                                            |
| `user_id` (FK)         | UUID        | Subscriber → `users.id`                                |
| `platform`             | VARCHAR(20) | `web`                                                  |
| `provider`             | VARCHAR(50) | `stripe`, etc. (web payment providers)                 |
| `provider_sub_id`      | VARCHAR(255)| External subscription ID                               |
| `status`               | VARCHAR(20) | `active`, `canceled`, `expired`, `trial`               |
| `started_at`           | TIMESTAMP   |                                                        |
| `renews_at`            | TIMESTAMP   | Next renewal / expiry                                  |
| `canceled_at`          | TIMESTAMP   | Nullable                                               |
| `created_at`           | TIMESTAMP   |                                                        |
| `updated_at`           | TIMESTAMP   |                                                        |

> **Rule:** Only users with an `active` subscription can **own / create** Dining Tables; joining tables never checks subscription.

### 6.3 Meals & Taxonomy

**Table: `meals`**

| Column              | Type          | Notes                                    |
|---------------------|---------------|------------------------------------------|
| `id` (PK)           | UUID          | Primary key                              |
| `title`             | VARCHAR(255)  | Meal title                               |
| `description`       | TEXT          | Short description                        |
| `prep_time_minutes` | INT           | Approximate prep time                    |
| `image_url`         | TEXT          | Main image                               |
| `is_active`         | BOOLEAN       | For deprecating meals                    |
| `created_at`        | TIMESTAMP     |                                          |
| `updated_at`        | TIMESTAMP     |                                          |

**Table: `cuisines`**

| Column          | Type         | Notes               |
|-----------------|-------------|---------------------|
| `id` (PK)       | SERIAL      | Primary key         |
| `name`          | VARCHAR(80) | Unique (e.g. Italian, Thai) |

**Table: `dietary_tags`**

| Column          | Type         | Notes                               |
|-----------------|-------------|-------------------------------------|
| `id` (PK)       | SERIAL      | Primary key                         |
| `code`          | VARCHAR(50) | e.g. `vegan`, `gluten_free`         |
| `label`         | VARCHAR(80) | Human-readable                      |

**Table: `meal_cuisines`** (many-to-many)

| Column           | Type | Notes                    |
|------------------|------|--------------------------|
| `meal_id` (FK)   | UUID | → `meals.id`             |
| `cuisine_id` (FK)| INT  | → `cuisines.id`          |
| **PK**           |      | (`meal_id`, `cuisine_id`)|

**Table: `meal_dietary_tags`** (many-to-many)

| Column               | Type | Notes                             |
|----------------------|------|-----------------------------------|
| `meal_id` (FK)       | UUID | → `meals.id`                      |
| `dietary_tag_id` (FK)| INT  | → `dietary_tags.id`               |
| **PK**               |      | (`meal_id`, `dietary_tag_id`)     |

### 6.4 Dining Tables & Rounds

**Table: `dining_tables`**

| Column                  | Type          | Notes                                               |
|-------------------------|---------------|-----------------------------------------------------|
| `id` (PK)               | UUID          | Primary key                                         |
| `owner_id` (FK)         | UUID          | → `users.id` (must have active subscription)        |
| `name`                  | VARCHAR(255)  | e.g. “Friday Family Dinner”                         |
| `date`                  | DATE          | Target date                                         |
| `meal_slot`             | VARCHAR(20)   | `breakfast`, `lunch`, `dinner`                      |
| `status`                | VARCHAR(20)   | `not_started`, `active`, `completed`, `archived`    |
| `invite_token`          | VARCHAR(64)   | Unique token for join links                         |
| `dietary_filter_json`   | JSONB         | Optional computed filters (dietary prefs, etc.)     |
| `created_at`            | TIMESTAMP     |                                                     |
| `updated_at`            | TIMESTAMP     |                                                     |
| `archived_at`           | TIMESTAMP     | When closed/archived                                |

**Table: `dining_table_participants`**

| Column              | Type     | Notes                                |
|---------------------|----------|--------------------------------------|
| `id` (PK)           | UUID     | Primary key                          |
| `table_id` (FK)     | UUID     | → `dining_tables.id`                 |
| `user_id` (FK)      | UUID     | → `users.id`                         |
| `role`              | VARCHAR(20)| `owner`, `member`                   |
| `joined_at`         | TIMESTAMP|                                      |
| `last_active_at`    | TIMESTAMP|                                      |
| **Unique index**    |          | (`table_id`, `user_id`)              |

**Table: `voting_rounds`**

| Column                   | Type          | Notes                                             |
|--------------------------|---------------|---------------------------------------------------|
| `id` (PK)                | UUID          | Primary key                                       |
| `table_id` (FK)          | UUID          | → `dining_tables.id`                              |
| `round_number`           | INT           | 1, 2, 3…                                          |
| `status`                 | VARCHAR(20)   | `active`, `completed`, `timeout`                  |
| `started_at`             | TIMESTAMP     |                                                   |
| `ends_at`                | TIMESTAMP     | 1‑hour deadline                                   |
| `decided_meal_id` (FK)   | UUID          | → `meals.id`, nullable until consensus/timeout    |
| `decision_reason`        | VARCHAR(30)   | `consensus`, `timeout_random`, `timeout_history`  |
| `created_at`             | TIMESTAMP     |                                                   |
| `updated_at`             | TIMESTAMP     |                                                   |

**Table: `round_meals`**

| Column              | Type | Notes                                 |
|---------------------|------|---------------------------------------|
| `id` (PK)           | UUID | Primary key                           |
| `round_id` (FK)     | UUID | → `voting_rounds.id`                  |
| `meal_id` (FK)      | UUID | → `meals.id`                          |
| `position`          | INT  | Optional ordering / sequence          |
| **Unique index**    |      | (`round_id`, `meal_id`)               |

**Table: `round_votes`**

| Column               | Type          | Notes                                            |
|----------------------|---------------|--------------------------------------------------|
| `id` (PK)            | UUID          | Primary key                                      |
| `round_id` (FK)      | UUID          | → `voting_rounds.id`                             |
| `meal_id` (FK)       | UUID          | → `meals.id`                                     |
| `user_id` (FK)       | UUID          | → `users.id`                                     |
| `vote`               | VARCHAR(10)   | `like`, `dislike`, `skip`                        |
| `created_at`         | TIMESTAMP     |                                                  |
| **Unique index**     |               | (`round_id`, `meal_id`, `user_id`)               |

> Logic: a consensus winner is a `meal_id` where all non‑skipping participants in a round have `vote = 'like'`. On timeout, select randomly from liked candidates or the last 3 winners for that table.

### 6.5 Solo Planning & History

**Table: `user_daily_plans`**

| Column                | Type          | Notes                                            |
|-----------------------|---------------|--------------------------------------------------|
| `id` (PK)             | UUID          | Primary key                                      |
| `user_id` (FK)        | UUID          | → `users.id`                                     |
| `date`                | DATE          | Plan date                                        |
| `meal_slot`           | VARCHAR(20)   | `breakfast`, `lunch`, `dinner`                   |
| `status`              | VARCHAR(20)   | `decided`, `skipped`, `none`                     |
| `meal_id` (FK)        | UUID          | → `meals.id`, nullable if skipped/none           |
| `created_at`          | TIMESTAMP     |                                                  |
| `updated_at`          | TIMESTAMP     |                                                  |
| **Unique index**      |               | (`user_id`, `date`, `meal_slot`)                 |

**Table: `user_swipe_counters`**

| Column            | Type        | Notes                                          |
|-------------------|------------|------------------------------------------------|
| `id` (PK)         | UUID       | Primary key                                    |
| `user_id` (FK)    | UUID       | → `users.id`                                   |
| `date`            | DATE       |                                                |
| `swipe_count`     | INT        | Number of meals added/decided that day         |
| `created_at`      | TIMESTAMP  |                                                |
| `updated_at`      | TIMESTAMP  |                                                |
| **Unique index**  |            | (`user_id`, `date`)                            |

> Used to enforce the **3 meals per day** limit (both solo and group decisions can increment this, depending on business rules).

**Table: `user_preferences`**

| Column              | Type          | Notes                                     |
|---------------------|---------------|-------------------------------------------|
| `id` (PK)           | UUID          | Primary key                               |
| `user_id` (FK)      | UUID          | → `users.id`                              |
| `dietary_tags_json` | JSONB         | e.g. `["vegan","gluten_free"]`           |
| `cuisine_ids_json`  | JSONB         | e.g. `[1, 3, 5]`                          |
| `created_at`        | TIMESTAMP     |                                           |
| `updated_at`        | TIMESTAMP     |                                           |

### 6.6 Analytics / Audit (Optional)

You can add lightweight metrics tables such as:

- **Table: `events`** – generic analytics events (e.g. `meal_swiped`, `round_started`) for BI and experimentation.

---

## 7. App Folder Structure (Web)

Recommended high‑level structure for the web application.

### 7.1 Web App (React / Next.js)

- **`web/`**
  - **`app/`** or **`src/`** (depending on framework)
    - **`pages/`** or route segments:
      - `/` (Landing / marketing)
      - `/app` (Shell)
      - `/app/onboarding`
      - `/app/home`
      - `/app/swipe`
      - `/app/tables`
      - `/app/history`
      - `/app/subscription`
      - `/app/profile`
    - **`components/`**
      - `MealCard.tsx`
      - `TableHeader.tsx`
      - `Layout/`, `Navigation/`, `Forms/` etc.
    - **`features/`** (feature‑oriented folders):
      - `auth/`
      - `meals/`
      - `dining-tables/`
      - `subscription/`
      - `user-preferences/`
    - **`lib/`**
      - API client, hooks, helpers (e.g. `useDiningTable`, `apiClient`)
    - **`store/`** (if using Redux / Zustand / etc.)
    - **`styles/`** or `theme/`
  - **`public/`**
    - Static assets, favicon, images
  - **`tests/`**
    - Unit and integration tests per feature

This structure keeps the **domain concepts** (users, meals, dining tables, rounds) aligned with the database schema and provides a clear organization for the web application.

