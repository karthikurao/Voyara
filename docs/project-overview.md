# Voyara Project Overview

This document provides an end-to-end explanation of the Voyara application, covering the customer experience, architecture, technology stack, data flows, and operational considerations. Use it as a single source of truth for onboarding, maintenance, and future enhancements.

---

## 1. Product Experience
- **Core value**: Generate personalized, multi-day travel itineraries in seconds, leveraging AI to tailor activities, timing, and dining suggestions.
- **Primary flows**:
  - Visitors land on the homepage and explore the planner without authentication.
  - Registered users log in via the `/login` page to unlock saving, refining, exporting, and sharing features.
  - Authenticated users create itineraries by specifying destination, vibe, travel days, and optional constraints.
  - The AI streams itinerary content in real time; users can accept, refine with natural-language prompts, or discard results.
  - Saved trips surface in the "My Trips" dashboard for management, duplication, deletion, and public toggle.
  - Share tokens allow secure, time-limited public links without exposing internal identifiers.
  - Users view and update profile metadata stored alongside itineraries.

---

## 2. High-Level Architecture
- **Client**: Next.js App Router (React 18) renders UI, handles routing, manages authentication tokens in `localStorage`, and issues fetch requests to internal API routes.
- **Server (API routes)**: Serverless functions hosted by Next.js on Vercel. They handle authentication, itinerary CRUD, sharing logic, and AI integration. Zod validates payloads, and each route references shared utilities in `lib/`.
- **Database**: Neon Postgres accessed through its REST endpoint. A lightweight wrapper (`lib/db.js`) standardizes fetch calls, headers, and result parsing.
- **AI Provider**: Google Gemini 2.0 Flash via the `@google/generative-ai` SDK handles itinerary generation with JSON-structured streaming responses.
- **Authentication**: Custom email/password flow using bcrypt hashing and JSON Web Tokens signed with `AUTH_SECRET`. Tokens are required for protected API routes and are parsed server-side.
- **File structure**: Organized by Next.js conventions with separate folders for components, pages, API handlers, tests, and utilities. See section 5 for details.

---

## 3. Key Technologies
- **Runtime**: Node.js (via Next.js 14).
- **Framework & Routing**: Next.js App Router (`src/app`).
- **UI & Styling**: Tailwind CSS, CSS Modules, `lucide-react` icons.
- **State & Auth Storage**: React hooks, browser `localStorage` for JWT persistence.
- **Security Libraries**: `bcryptjs`, `jsonwebtoken`, `jose` (for token verification helpers).
- **Validation**: Zod schemas on API inputs.
- **Build Tooling**: ESLint with Next.js config, PostCSS, Autoprefixer, Tailwind.
- **Analytics**: `@vercel/analytics` for optional runtime telemetry.

---

## 4. Data Flow Overview
1. **Registration**: `/api/auth/register` receives `{ email, password }`. Passwords are hashed with bcrypt, stored in Neon, and a JWT is returned.
2. **Login**: `/api/auth/login` verifies credentials against stored hashes and issues a fresh JWT as a Bearer token.
3. **Authenticated Requests**: The client includes `Authorization: Bearer <token>` in requests. Server routes verify the token and extract the user ID for database operations.
4. **Itinerary Generation**: `/api/generate` consumes user prompts plus optional constraints, invokes Gemini with streaming JSON, and returns structured itinerary data to the client.
5. **Persistence**: `/api/itineraries/*` routes read/write data in Neon tables (`itineraries`, `shares`, `profiles`, `users`). Mutations require valid JWTs.
6. **Sharing**: `/api/itineraries/shares` issues signed share tokens (30-day expiry) using `SHARE_TOKEN_SECRET`. Public viewers access share pages with token verification, never exposing internal IDs.

---

## 5. Codebase Layout
```
lib/
  auth.js            // Password hashing and JWT helpers
  db.js              // Neon REST wrapper
public/              // Static assets
src/app/
  layout.js          // Root layout and metadata
  globals.css        // Global Tailwind styles
  page.js            // Landing page
  login/page.js      // Auth form
  my-trips/page.js   // User itinerary dashboard
  profile/page.js    // Profile details
  share/[id]/page.js // Public itinerary view via share token
  api/
    auth/
      register/route.js
      login/route.js
    generate/route.js
    itineraries/...   // CRUD, sharing, duplication, exports
      __tests__/      // Integration tests and docs
components/
  Header.js, GeneratorForm.js, SavedItineraryList.js, etc.
```
Additional configuration files (`tailwind.config.js`, `postcss.config.js`, `eslint.config.mjs`, `next.config.mjs`) live at the repo root. The `docs/` folder (this file) centralizes extended documentation.

---

## 6. Authentication & Authorization
- **Registration**: Ensures the Postgres `users` table exists (see Neon schema). Calls `hashPassword` before storing.
- **JWT Issuance**: `signAuthToken(user)` encodes `sub` (user ID) and email, using `AUTH_SECRET` and a default expiration (configured in `lib/auth.js`).
- **JWT Verification**: `verifyStackAuthJWT` (name retained for historical reasons) extracts payload data. Routes reject requests with invalid/expired tokens.
- **Client Handling**: Tokens persist in `localStorage` under `voyaraAuthToken`. The Header and other components use React state to reflect auth status, provide logout, and guard protected UI actions.
- **Testing Tokens**: `TEST_AUTH_TOKEN` (configured in the env) supports automated API tests without hitting real auth endpoints.

---

## 7. AI Generation Pipeline
- **Prompt Construction**: The planner gathers user input (destination, days, vibe, transport, etc.) and sends it to `/api/generate`.
- **Streaming Response**: The route initializes the Gemini client with `@google/generative-ai`, configures JSON schema expectations, and streams itinerary segments back to the browser.
- **Refinement**: Users can submit follow-up prompts that augment the same itinerary context, enabling iterative adjustments without manual edits.
- **Error Handling**: The client surfaces provider errors and encourages retry if rate limits or invalid inputs occur.

---

## 8. API Surface
- `POST /api/auth/register`: Register new users; returns JWT.
- `POST /api/auth/login`: Authenticate existing users; returns JWT.
- `POST /api/generate`: Generate itinerary via Gemini; applies rate limiting and validation.
- `GET /api/itineraries/list`: Fetch authenticated user itineraries.
- `POST /api/itineraries/save`: Persist a newly generated itinerary.
- `PATCH /api/itineraries/update`: Update itinerary metadata or content.
- `POST /api/itineraries/duplicate`: Clone an itinerary for edits.
- `DELETE /api/itineraries/delete`: Remove an itinerary owned by the user.
- `POST /api/itineraries/toggle-public`: Toggle shareable status and manage share tokens.
- `GET /api/itineraries/shares`: List shareable itineraries with their token metadata.
- `POST /api/itineraries/shares`: Issue or revoke a share token.
- `POST /api/share/sign`: Validate share tokens for public viewing.
- `GET /api/itineraries/export/...`: ICS/JSON export endpoints (check files for specifics).

Each handler uses `neonQuery` to talk to Postgres and `verifyStackAuthJWT` for auth gating when necessary.

---

## 9. Database Schema (Neon)
The provided `sql/neon-schema.sql` file creates and maintains tables:
- `users`: `id`, `email`, `password_hash`, timestamps.
- `profiles`: `user_id`, profile metadata (name, avatar).
- `itineraries`: `id`, `user_id`, `title`, `metadata`, `day_plans`, creation timestamps.
- `shares`: `id`, `itinerary_id`, `token`, `expires_at`, `is_public`.
- Supporting extensions (e.g., `pgcrypto`) for UUID generation and cryptographic functions.

All relations enforce ownership through foreign keys, ensuring itineraries and share entries link back to the authenticated user.

---

## 10. Environment & Configuration
Create `.env.local` (or see `env.example`):
```
GOOGLE_API_KEY=...           # Required for Gemini
NEON_API_URL=...             # Neon REST endpoint
NEON_API_KEY=...             # Optional for private Neon instances
AUTH_SECRET=...              # JWT signing secret
SHARE_TOKEN_SECRET=...       # Share link signing secret
TEST_AUTH_TOKEN=...          # Optional; used by automated tests
```
Use long, random strings for `AUTH_SECRET` and `SHARE_TOKEN_SECRET`. In production, configure Vercel project settings with the same values.

---

## 11. Build, Test, and Deployment
- **Install**: `npm install`
- **Dev server**: `npm run dev` (listens on port 3000 by default).
- **Lint**: `npm run lint` (ESLint + Next.js rules).
- **Build**: `npm run build` (Next.js production build).
- **Start**: `npm run start` (runs compiled build).
- **Tests**: API integration tests live in `src/app/api/itineraries/__tests__/`. Follow the README in that directory for running instructions, ensuring `TEST_AUTH_TOKEN` is set.
- **Deployment**: Designed for Vercel. Configure environment variables, connect the GitHub repo, and use the default Next.js build command.

---

## 12. Security Considerations
- **Authentication**: JWTs expire on a schedule (see `lib/auth.js`); ensure token rotation strategy if extending sessions.
- **Transport Security**: Host on HTTPS (Vercel default); Neon REST endpoint should also enforce TLS.
- **Database Access**: Restrict Neon API key privileges; use row-level security if needed.
- **CSRF**: Routes validate `req.headers.get("origin")` where applicable to enforce same-origin requests.
- **Rate Limiting**: Generation and share endpoints throttle excessive requests to protect API quotas.
- **Input Validation**: Zod schemas guard itinerary payloads to prevent SQL injection via REST.

---

## 13. Operational Notes
- Monitor Gemini API usage to avoid quota overruns.
- Clean up expired share tokens via scheduled job if required; currently expiry is enforced during validation.
- Keep dependencies updated (`npm outdated`) to patch security vulnerabilities.
- Back up Neon database snapshots before significant schema changes.
- Review analytics events (if enabled) to track user engagement.

---

## 14. Future Enhancements (Ideas)
- OAuth integrations (e.g., Google sign-in) sharing the same JWT issuance pipeline.
- Rich itinerary editing with drag-and-drop reordering.
- Collaborative planning with multiple invitees per itinerary.
- Native mobile wrappers using Next.js API endpoints.
- Automated reminder emails for upcoming trips using share token expiry metadata.

---

## 15. References
- README highlights: `README.md`
- Environment template: `env.example`
- Auth utilities: `lib/auth.js`
- Database helper: `lib/db.js`
- Tests and guidelines: `src/app/api/itineraries/__tests__/`
- Configuration: `next.config.mjs`, `tailwind.config.js`, `eslint.config.mjs`

This overview should equip new contributors and stakeholders with the context needed to operate, extend, or audit the Voyara platform. For deeper dives, refer to the linked source files and inline comments.
