<div align="center">
  <br />

  <br />
  <br />
  <h1>Yashu</h1>
  <p><strong>A simple AI assistant for engineering work</strong></p>
  <br />
  <p>
    <img src="https://img.shields.io/badge/Next.js-14.2-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 14.2">
    <img src="https://img.shields.io/badge/PWA-Enabled-8A2BE2?style=flat-square&logo=pwa&logoColor=white" alt="PWA">
    <img src="https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
    <img src="https://img.shields.io/badge/Tailwind-v3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  </p>
  <br />
</div>

---

## ✨ Features

- **AI Chat** — Conversational interface powered by OpenRouter + AI SDK
- **Admin Panel** — Manage chats, files, users, logs, settings, terminal
- **Supabase Auth** — Email/password authentication with SSR
- **PWA** — Installable on Android/iOS, offline fallback, auto-update with user control
- **Dark Theme** — Near-black (#0A0A0A) UI with indigo accent, responsive down to mobile

---

## 📱 Installing as a PWA

### Android (Chrome)
1. Open the app in Chrome
2. Tap the **Install App** button at the bottom of the screen
3. Confirm the install dialog

### iOS (Safari)
1. Open the app in Safari
2. Tap the **Share** button
3. Scroll down and tap **Add to Home Screen**

> The install tip appears automatically on iOS devices. Dismiss it with ✕.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials and OpenRouter API key

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `JWT_SECRET` | JWT signing secret |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI |
| `ADMIN_EMAIL` | Admin user email |

---

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── admin/            # Admin dashboard & management
│   ├── api/              # API routes (chat, auth, admin, etc.)
│   ├── chat/             # Chat interface
│   ├── login/            # Authentication
│   ├── offline/          # Offline fallback page
│   └── register/         # User registration
├── components/
│   ├── auth/             # Login/register forms
│   ├── chat/             # Chat input, sidebar, messages
│   ├── layout/           # Admin sidebar
│   └── ui/               # shadcn/ui base components
├── hooks/                # use-auth, useServiceWorkerUpdate
├── lib/                  # Supabase clients, AI bridge, utils
├── middleware/            # Auth & admin middleware
├── services/             # Chat, file, log, settings, etc.
├── styles/               # Global CSS with theme variables
└── types/                # TypeScript type definitions
```

---

## 🔄 PWA Update Flow

1. A new version is deployed to production
2. The service worker downloads the update in the background
3. A **"New version available"** banner appears at the bottom of the screen
4. The user clicks **Update** to activate the new version
5. The page reloads with the latest code — no manual cache clearing needed

> Skip-waiting is disabled by default. Updates are user-initiated, never silent.

---

## 🎨 Theme

| Token | Value | Description |
|---|---|---|
| `--background` | `0 0% 4%` | Near-black (#0A0A0A) |
| `--foreground` | `0 0% 88%` | Light gray text |
| `--primary` | `239 84% 67%` | Indigo accent |
| `--border` | `0 0% 11%` | Subtle borders |
| `--muted` | `0 0% 8%` | Muted backgrounds |
| `--radius` | `0.5rem` | Component rounding |

Font: **Inter** (headings & body) with **JetBrains Mono** (code).

---

## 🔧 Replacing Placeholder Assets

| File | Replace with |
|---|---|
| `public/logo.png` | Your app logo (then uncomment `<Image>` in `src/components/Logo.tsx:11`) |
| `public/icons/icon-192x192.png` | PWA icon 192×192 (PNG) |
| `public/icons/icon-512x512.png` | PWA icon 512×512 (PNG) |

Maintain the same filenames for zero config changes.

---

## 📄 License

MIT

---

<div align="center">
  <br />
  <sub>Built with Next.js · Supabase · Tailwind CSS · shadcn/ui</sub>
  <br />
  <br />
</div>
