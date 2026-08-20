# 🤖 hi-its-yashu

### *Your AI engineering agent — CLI + Web, one brain, one API key.*

A personal AI agent for engineering work. Chat with it from your **terminal** (CLI + agent mode) or your **browser** (web chat). Both use the **same** OpenRouter API key.

---

## 🔑 Where to put your API key

Get a key (free tier available) at https://openrouter.ai/keys — then set `OPENROUTER_API_KEY` in **two** places:

| Where | File | What it powers |
| ----- | ---- | -------------- |
| CLI / agent | `.env` (project root) | `hi-its-yashu` command, agent mode, telegram mode |
| Web chat | `web/.env.local` | the Next.js web app |

Setup:

```bash
cp .env.example .env          # then edit .env  -> OPENROUTER_API_KEY=sk-or-v1-...
cp web/.env.example web/.env.local   # same key here
```

**Use the same key everywhere** so web and CLI share one agent.

Optional env vars:

- `OPENROUTER_DEFAULT_MODEL` — model override (default `openai/gpt-4o-mini`)
- `OPENAI_API_KEY` — enables experimental vector memory in agent mode
- `YASHU_SYSTEM_PROMPT` — custom system prompt for the web assistant

---

## 🖥 Web version

Self-contained Next.js app — **no database, no login** needed. Black theme, animated, mobile + desktop friendly, chat history saved in your browser.

```bash
cd web
npm install
npm run dev        # -> http://localhost:3000
```

Production: `npm run build && npm start`

---

## ⌨️ CLI version

Wake the agent up from anywhere:

```bash
hi-its-yashu wakeup lets go    # show banner -> pick CLI / Telegram mode
hi-its-yashu wakeup            # same thing
hi-its-yashu                   # bare invocation also wakes up
```

First time, link the global command (undo with `bun unlink`):

```bash
bun install
bun link                       # registers the `hi-its-yashu` command
```

Without linking, run locally with: `bun index.ts wakeup lets go`

### Agent mode

Inside the CLI pick **Agent Mode** — the agent uses the same `OPENROUTER_API_KEY` from root `.env`, with tools for file ops, shell commands, web search, and an approval flow before changes are applied.

---

## 📁 Structure

```
├── index.ts            CLI entry (wakeup)
├── ai/                 model wiring (OpenRouter)
├── modes/              cli / agent / plan / ask / telegram
├── memory/             experimental memory + vector store
├── tui/                terminal banner + markdown rendering
└── web/                Next.js web chat (self-contained)
```

## 🛠 Tech

TypeScript · Bun · Node · OpenRouter AI SDK · Next.js 14 · React · Tailwind · Framer Motion · Supabase-free

---

## 🚀 Deploying the web version

The web app is a standard Next.js app with **no database** — you only need to set the OpenRouter key as an env var.

### Option 1 — Vercel (free, ~2 min)

```bash
cd web
npx vercel
```

- Follow the prompts (login, link project). When asked for a **root directory**, use `../` and select the `web/` folder — or simply run `npx vercel` from `web/` and use it as the project dir.
- In the Vercel dashboard → Settings → Environment Variables, add:
  - `OPENROUTER_API_KEY` = your key
  - (optional) `OPENROUTER_DEFAULT_MODEL`, `YASHU_SYSTEM_PROMPT`
- Redeploy, done. `npx vercel --prod` to ship.

### Option 2 — Self-host (Node server)

```bash
cd web
npm run build
npm start          # serves on http://localhost:3000
```

On a VPS, keep it alive with PM2:

```bash
npm i -g pm2
pm2 start npm --name yashu-web -- start
pm2 save && pm2 startup
```

### Option 3 — Docker (for any server)

Minimal `web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
cd web && docker build -t yashu-web . && docker run -p 3000:3000 -e OPENROUTER_API_KEY=sk-or-v1-... yashu-web
```

> 🔐 The key stays server-side — the browser never sees it. Chat history is per-browser (localStorage).

---

**Yashu Singh** — engineering student building AI, one experiment at a time.