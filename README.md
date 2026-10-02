# LOOP — AI Customer-Feedback Intelligence Platform

A multi-tenant SaaS platform that ingests customer feedback from multiple
channels, classifies and clusters it with AI, surfaces trends, answers
plain-English questions grounded in real feedback, and generates automated
Voice-of-Customer reports.

Built for the Zidio Development Internship — Web Development Track.

**Live demo:** _add your Vercel URL here_
**Demo video:** _add your unlisted YouTube/Drive link here_

---

## Features

### Core
- **Multi-tenant workspaces** — every company's data is fully isolated; no
  query ever runs without a server-side workspace filter
- **Role-based access control** — Admin / Analyst / Viewer, enforced on
  every API route (not just hidden in the UI)
- **Feedback ingestion** — single entry, CSV bulk upload, simulated channel
  import (Zendesk, App Store, Typeform, Gong, etc.)
- **Feedback inbox** — search, filters (channel, sentiment, status, theme,
  date range), server-side pagination, status workflow (New → Reviewed →
  Actioned)
- **Analytics dashboard** — volume/sentiment/top-theme charts with a
  selectable date range (7/14/30/90 days), real numbers computed from the
  database
- **Team management** — add members (temporary password, no email required),
  change roles, remove members — takes effect immediately, no re-login needed

### AI (Google Gemini)
- **Auto-classification (AI1)** — every new item is sent to Gemini and
  tagged with sentiment, sentiment score, 1–3 themes (reusing existing
  themes where they fit), and a feature area. Structured JSON output,
  validated with Zod. Manual re-classify action included.
- **Theme clustering & trends (AI2)** — themes are built from real AI
  classifications; the Trends page flags themes spiking vs. the previous
  period.
- **Ask LOOP (AI3)** — a grounded Q&A assistant. Retrieves the most relevant
  feedback for a question (keyword/IDF-weighted retrieval), then asks
  Gemini to answer *only* from those items, with citations back to source
  feedback. If nothing relevant exists, it says so instead of inventing an
  answer.
- **Voice-of-Customer report (AI4)** — statistics, top themes, and verbatim
  quotes are computed directly from the database, never invented; Gemini
  writes only the narrative summary and recommendations around those real
  numbers. Reports are saved, viewable later, and exportable as PDF.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | NextAuth (Credentials provider, JWT sessions) |
| AI | Google Gemini API (`gemini-3.5-flash`) |
| Charts | Recharts |
| Validation | Zod |
| Deployment | Vercel |

> **Note:** the original brief specifies the Anthropic Claude API; this
> build uses Google Gemini instead. The AI architecture — structured
> classification, retrieval-grounded Q&A, stats-in-code + AI narrative for
> reports — follows the same principles either way; only the model
> provider changed (`src/lib/ai.ts`).

---

## Architecture

Three-tier: browser → Next.js API route handlers → PostgreSQL (via Prisma)
and the Gemini API. The browser never talks to the database or Gemini
directly — every AI call and every database query happens server-side,
behind an authenticated session.

Client (Next.js App Router)
│
▼
API routes (/api/*) — session check → role check → workspace-scoped query
│ │
▼ ▼
PostgreSQL (Prisma) Gemini API (classification, Ask LOOP, reports)


Data model: `Workspace` → `User`, `Feedback`, `Theme`, `Report`.
`Feedback` ↔ `Theme` is many-to-many via `FeedbackTheme`.

---

## Security & tenant isolation

Every query that touches feedback, themes, reports, or users is filtered by
the caller's `workspaceId`, taken from the server-side session — never from
a client-supplied value. Row lookups by id also re-check `workspaceId`
(`findFirst({ id, workspaceId })`), so guessing another workspace's id
returns 404, not data.

This was verified manually with two live workspaces and a scripted set of
checks covering:
- Cross-tenant access attempts (reading/modifying another workspace's
  feedback, reports, and members by guessed id) — all correctly return 404
- Role enforcement (Viewer attempting write actions) — all correctly
  return 403, server-side, independent of the UI
- Self-protection (an Admin cannot demote or remove themselves, so a
  workspace can never end up with zero admins)
- Malformed input handling (invalid enums, garbage dates, missing fields)
  — all return clean 400 responses rather than crashing

---

## Local setup

### Prerequisites
- Node.js 18+
- A free PostgreSQL database ([Neon](https://neon.tech))
- A Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Steps

```bash
git clone <your-repo-url>
cd loop-web
npm install

cp .env.example .env
# fill in DATABASE_URL (Neon), NEXTAUTH_SECRET (openssl rand -base64 32),
# and GEMINI_API_KEY

npx prisma migrate dev --name init
npm run seed

npm run dev
# → http://localhost:3000
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon pooled connection recommended) |
| `NEXTAUTH_URL` | App base URL — `http://localhost:3000` locally, your Vercel URL in production |
| `NEXTAUTH_SECRET` | Random secret for session signing — generate with `openssl rand -base64 32` |
| `GEMINI_API_KEY` | Google Gemini API key |

---

## Screenshots

_Add 3–5 screenshots here before submitting: Dashboard, Inbox, Ask LOOP with
a real answer, a generated Report, and the Trends page._

---

## Project structure

src/
app/
(auth)/ # login, signup
(app)/ # dashboard, inbox, trends, ask, reports, settings
api/ # all backend route handlers
components/ # UI building blocks
lib/
ai.ts # Gemini client + JSON/text helpers
classification-service.ts # AI1 — auto-classification
retrieval.ts # AI3 — keyword retrieval for Ask LOOP
report-service.ts # AI4 — VoC report generation
auth.ts # NextAuth config
db.ts # Prisma client
mappers.ts # Prisma row → frontend DTO conversion
prisma/
schema.prisma
seed.ts # 1 workspace, 3 users, 6 themes, 120 feedback items


---

## Known limitations

- Retrieval for Ask LOOP uses keyword/IDF scoring rather than vector
  embeddings (no separate embeddings provider required) — accurate enough
  for a workspace-sized dataset, but not true semantic search.
- No email delivery: adding a team member creates their account directly
  and shows a one-time temporary password for the admin to share manually.
- CSV imports are classified sequentially, so very large files (100+ rows)
  take a while — tested comfortably up to ~40 rows per import.
- No login rate-limiting and no per-user limit on AI calls — acceptable for
  this project's scope, but would be needed before real production use.

---