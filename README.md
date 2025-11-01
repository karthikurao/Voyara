# ✨ Voyara - AI-Powered Itinerary Generator

Voyara is a sleek, modern web application that crafts personalized travel itineraries in seconds. Users can specify a destination, desired "vibe," transport preferences, and number of days. Our AI planner generates a detailed, day-by-day schedule with specific timings, streamed in real-time and beautifully presented. Logged-in users can refine, save, export, and share trips securely.

---

## 🚀 Live Demo

**Try Voyara live:** [**`voyara-x4zm`**](https://voyara-x4zm.vercel.app/)

---

## 🌟 Features

- AI-powered itinerary generation powered by Google Gemini 2.0 Flash with JSON streaming
- Vibe-based planning with transport and seasonal constraints
- Specific activity timings (e.g., 9:00 AM) and food suggestions per day
- Real-time streaming responses
- Refine generated plans with natural-language adjustments
- Save itineraries to your account; view under My Trips
- Share securely via signed tokens (30-day expiry) instead of raw IDs
- Export options: ICS calendar, JSON download, and Print-to-PDF
- Responsive UI with polished skeleton loading states

### Security & Hardening
- CSRF protection via same-origin checks on API routes
- Input validation using Zod on API payloads
- Basic rate limiting on generation and share-link endpoints
- Strict Content Security Policy (stricter in production; no `unsafe-eval`)
- JWT-based authentication backed by Neon and signed with an application secret
- Secure database access via Neon REST API

---

## 🛠️ Tech Stack

- Framework: Next.js 14 (App Router)
- Language: JavaScript
- Styling: Tailwind CSS
- Database: Neon (Postgres REST API)
- Auth: Custom email/password (JWT signed with `AUTH_SECRET`)
- AI: Google Gemini (`@google/generative-ai`)
- Icons: `lucide-react`
- Deployment: Vercel

---


## ⚙️ Getting Started (Local)

1) Clone
```bash
git clone https://github.com/YOUR_USERNAME/voyara.git
cd voyara
```

2) Install
```bash
npm install
```

3) Env vars (.env.local or see `env.example`)
```env
GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
NEON_API_URL="https://YOUR_NEON_REST_ENDPOINT/rest/v1"
NEON_API_KEY="YOUR_OPTIONAL_NEON_API_KEY"
AUTH_SECRET="A_LONG_RANDOM_STRING"
SHARE_TOKEN_SECRET="ANOTHER_LONG_RANDOM_STRING"
```

4) Neon SQL schema
- See `/sql/neon-schema.sql` for table creation (itineraries, shares, profiles)

5) Run dev
```bash
npm run dev
```

Open http://localhost:3000

---

## API Route Testing
- See `src/app/api/itineraries/__tests__/README.md` for integration test instructions.

---

## 🔐 Authentication Workflow
- Users register and log in with email + password (`/login` page).
- Credentials are stored in Neon (`users` table) with bcrypt hashing.
- Successful login returns a JWT signed with `AUTH_SECRET`; the client stores it in `localStorage` as `voyaraAuthToken` and includes it as a Bearer token for protected API calls.
- To seed users manually you can call `/api/auth/register` with `{ email, password }`.

---

## Notes
- For production, set a strong `SHARE_TOKEN_SECRET`. Share links expire in 30 days by default.
- User JWT tokens are stored in `localStorage` under the key `voyaraAuthToken` after login.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Check the [issues page](https://github.com/karthikurao/voyara/issues).

---

## 📝 License
MIT License – see `LICENSE`.
