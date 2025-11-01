# API Route Tests for Voyara Neon + JWT Auth

## Overview
These tests validate the Neon-backed itinerary CRUD and shares API routes using the built-in JWT authentication.

- `crud.test.js`: Tests save, list, update, duplicate, toggle-public, and delete itinerary endpoints.
- `shares.test.js`: Tests listing and revoking share tokens for itineraries.

## How to Run
1. Create a test user via the `/api/auth/register` route (or the UI) and copy the JWT that is returned. Set it in your environment:
   ```sh
   export TEST_AUTH_TOKEN=your_test_jwt_here
   ```
2. (Optional) Set `testItineraryId` in `shares.test.js` to a valid itinerary ID for your test user.
3. Start your Next.js app locally:
   ```sh
   npm run dev
   ```
4. Run tests:
   ```sh
   npx vitest run src/app/api/itineraries/__tests__/*.test.js
   ```

## Notes
- These are minimal integration tests. Expand as needed for edge cases and error handling.
- Ensure your Neon database has the required tables (`users`, `itineraries`, `shares`) for the test user.
