## Supabase Setup – pickonemeal.com

This folder documents how the web application connects to Supabase and which environment variables are required.

The **database schema** for this project lives in the root file `supabase_schema.sql`. Run it in the Supabase SQL editor or add it to your migration tooling.

---

## 1. Required environment variables

The web application uses the following environment variables:

- **`SUPABASE_URL`**: Your Supabase project URL.
- **`SUPABASE_ANON_KEY`**: Public anon key (safe for clients).
- **`SUPABASE_SERVICE_ROLE_KEY`**: Service role key (server‑side only, NEVER shipped to client apps).

Recommended naming for web (Next.js):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

See `.env.example` in this folder for a template.

---

## 2. API contracts and core entities

The core entities are defined in `product_feature.md` and implemented in `supabase_schema.sql`. Key tables:

- `profiles` (extends `auth.users` with app profile data).
- `subscriptions` (per‑user subscription status).
- `meals`, `cuisines`, `dietary_tags`, `meal_cuisines`, `meal_dietary_tags`.
- `dining_tables`, `dining_table_participants`.
- `voting_rounds`, `round_meals`, `round_votes`.
- `user_daily_plans`, `user_swipe_counters`, `user_preferences`.

The web application should treat these tables as the **single source of truth** for app data.

---

## 3. Web client (Next.js / React)

Typical client setup (used only as a reference here; the actual file will live in the `web/` app):

```ts
// web/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});
```

API access patterns:

- Use **Row Level Security (RLS)** policies to keep client‑side access safe.
- Use Edge Functions or RPCs for:
  - Starting/ending voting rounds.
  - Enforcing the 3‑meals‑per‑day rule.

---

## 4. Backend RPCs & scheduled jobs

The SQL file `supabase_functions.sql` defines Postgres functions that centralise business logic:

- **`create_dining_table(p_name, p_date, p_meal_slot)`**
  - Enforces that the caller (`auth.uid()`) has an **active subscription** before creating a table.
  - Inserts into `dining_tables` and ensures the owner is in `dining_table_participants`.

- **`start_round(p_table_id)`**
  - Validates the caller is the table owner and there is no other active round.
  - Creates a new `voting_rounds` row and populates `round_meals` with random active meals.

- **`end_round(p_round_id)`**
  - Applies timeout logic to decide a winner using votes or, if needed, previous winners.

- **`process_expired_rounds()`**
  - Finds all `voting_rounds` where `status = 'active'` and `ends_at < now()`, and calls `end_round` on each.
  - Returns the number of rounds processed.

You can hook `process_expired_rounds()` up to a **Supabase scheduled job / cron** so expired rounds are automatically closed server‑side.


