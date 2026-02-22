# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-01

### Added

- AI-powered itinerary generation using Google Gemini 2.0 Flash with JSON streaming
- Vibe-based trip planning with transport mode and seasonal constraints
- Specific activity timings and food suggestions per day
- Real-time streaming responses for itinerary generation
- Refine generated plans with natural-language adjustments
- User authentication with email/password (JWT-based, bcrypt-hashed)
- Save itineraries to user accounts
- My Trips page to view and manage saved itineraries
- Secure trip sharing via signed tokens with 30-day expiry
- Export options: ICS calendar, JSON download, and Print-to-PDF
- User profile page with image upload
- Source city and transport mode selection
- Travel period/month selection
- Responsive UI with polished skeleton loading states
- Vercel Analytics integration

### Security

- CSRF protection via same-origin checks on API routes
- Input validation using Zod on all API payloads
- Rate limiting on generation and share-link endpoints
- Strict Content Security Policy (no `unsafe-eval` in production)
- JWT authentication backed by Neon PostgreSQL
- Secure database access via Neon REST API
- Runtime validation for all environment variables (`GOOGLE_API_KEY`, `AUTH_SECRET`, `NEON_API_URL`)

### Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Neon (PostgreSQL REST API)
- Google Gemini AI (`@google/generative-ai`)
- Deployed on Vercel

[1.0.0]: https://github.com/karthikurao/Voyara/releases/tag/v1.0.0
