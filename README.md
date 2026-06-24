# SelfLab

Your private, single-user health & fitness companion — a live-in coach that
tracks training, nutrition, activity, sleep, recovery and habits, and coaches
you on your day in real time. Built for one person: you.

> Tuned for a **fat-loss / get-lean** goal, dark-first and designed to feel like
> a crafted product — not a template.

## What's inside

- **Dashboard** — Health Score, readiness, calories/macros, steps, water, sleep, weight trend, today's plan.
- **Activity** — live GPS runs/walks/rides, step counter, a private activity feed, and Google Health Connect sync (steps, HR, HRV, sleep, weight).
- **Fuel** — meal logging by search, **AI describe-a-meal**, manual entry and barcode scan; macros, calories and water.
- **Train** — exercise library, live session logger with rest timer and PR tracking, templates, recommendations, and a weekly planner.
- **Coach** — a 24/7 Gemini-powered chat that knows your data, morning/evening briefings (with read-aloud), and a hub to every tool.
- **Sleep & recovery**, **wellbeing** (mood check-ins, breathwork, supplements), **habits & streaks**, **journal**, and **progress** (body metrics + photos).

## Tech stack

Expo (SDK 56) · React Native · TypeScript · Expo Router · custom design system ·
Reanimated · react-native-svg charts · Supabase (Postgres + Auth + Storage +
Edge Functions) · TanStack Query (offline-first) · Zustand · Gemini.

## Run it

> The app needs a **native dev build** (not Expo Go) because it uses Health
> Connect, background location, sensors and maps. You also run fully in **demo
> mode** with seeded local data before adding any backend.

### 1. Install

```bash
npm install
cp .env.example .env   # then fill in the values below
```

### 2. Supabase (cloud sync + AI)

1. Create a free project at [supabase.com](https://supabase.com).
2. Put the project URL + anon key into `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Apply the schema — either run the files in `supabase/migrations/` in the SQL
   editor (in order), or with the CLI:
   ```bash
   supabase link --project-ref YOUR-REF
   supabase db push
   ```
4. Deploy the AI edge functions and set your Gemini key as a secret (it never
   ships in the app):
   ```bash
   supabase secrets set GEMINI_API_KEY=your-gemini-key
   supabase functions deploy estimate-meal
   supabase functions deploy ai-coach
   ```

### 3. Maps — nothing to do 🎉

Activity maps use **free OpenStreetMap tiles** (CARTO dark) rendered with Leaflet
in a WebView — no API key, no billing, no Google Cloud account.

### 4. Build & run on your Android phone

```bash
npm i -g eas-cli && eas login          # free Expo account
eas build --profile development --platform android
# install the resulting APK on your phone, then:
npx expo start --dev-client
```

On first launch, sign up (or tap **demo mode**), finish onboarding, and grant
Health Connect / location / notification permissions when prompted.

## Demo mode

Without Supabase credentials the app runs entirely on-device: a local store
(`src/lib/localDb.ts`) backs every screen and is pre-seeded with a believable
week of data, and the coach falls back to a local, data-grounded reply. Add the
backend later and your account syncs to the cloud.

## Project structure

```
src/
  app/            Expo Router screens ((auth), (tabs), feature routes)
  components/     UI kit, charts, tab bar
  features/       cross-cutting hooks (useToday)
  lib/            data layer, engines (nutrition/readiness/healthScore),
                  supabase, gemini, health connect, notifications
  stores/         zustand (auth, profile, settings)
  theme/          design tokens
supabase/
  migrations/     schema + RLS + seed + storage
  functions/      Gemini edge functions
```

## Scripts

```bash
npm start          # dev server (use --dev-client for the native build)
npx tsc --noEmit   # typecheck
```

---

Private project — built for one user.
