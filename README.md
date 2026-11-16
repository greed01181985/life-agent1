# Life Agent

Proactive personal AI chief-of-staff. Mobile-first product built with Expo (React Native) + Node.js backend.

## What it does (MVP)

- **Daily Briefing** – morning summary of calendar, conflicts, and upcoming renewals
- **Chat** – natural conversation with the agent
- **Approvals** – review & one-tap approve/dismiss proposed actions (emails, reschedules, reminders)
- **Settings** – connect Google Calendar/Gmail, preferences

The agent never takes irreversible actions without explicit approval.

## Project structure

```
life-agent/
├── mobile/          # Expo React Native app
├── backend/         # Express + TypeScript API
└── shared/          # Shared TypeScript types
```

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Google OAuth credentials (see below)
npx tsx src/index.ts
# → http://localhost:3001
```

### 2. Mobile

```bash
cd mobile
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

Set the API URL if needed:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001 npx expo start
```

## Google OAuth setup (required for real Calendar + Gmail)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable these APIs:
   - Google Calendar API
   - Gmail API
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3001/connections/google/callback`
   - (later) your production callback URL
7. Copy the **Client ID** and **Client Secret** into `backend/.env`:

```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/connections/google/callback
```

8. Under **OAuth consent screen**, add your email as a test user (while the app is in Testing status).

After that, open the app → **Settings → Connect Google**. You’ll be taken through the Google consent screen and redirected back.

## What works once Google is connected

- Chat understands “what’s on my calendar today?”, “any conflicts?”, etc.
- **Generate Briefing** pulls real events and detects overlaps
- Approving a “draft email” action creates a real Gmail draft
- Connected status appears in Settings

## Current status

- [x] Mobile shell with navigation, dark theme, core screens
- [x] Chat UI
- [x] Daily Briefing screen
- [x] Approvals flow (approve / dismiss)
- [x] Settings + onboarding
- [x] Backend API (chat, briefing, approvals)
- [x] **Google OAuth + Calendar + Gmail integration**
- [ ] Real LLM agent loop (tool calling)
- [ ] Persistent database (Postgres + pgvector)
- [ ] Push notifications
- [ ] Background job for scheduled morning briefings

## Next steps

1. Wire the mobile chat fully to the live backend (streaming, conversation history)
2. Introduce a proper LLM agent loop with tool calling
3. Add Postgres + proper user accounts
4. Scheduled daily briefings + push notifications

## Product vision

A privacy-respecting, approval-gated personal agent that reduces life admin. Start with calendar + email, expand into subscriptions, home maintenance, family logistics, and more.
