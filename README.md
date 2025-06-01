# ✨ Voyara - AI-Powered Itinerary Generator

Voyara is a sleek, modern web application that crafts personalized travel itineraries in seconds. Users can specify a destination, desired "vibe," and the number of days for their trip. Our AI-powered planner then generates a detailed, day-by-day schedule with specific timings, streamed to the user in real-time and beautifully presented. Logged-in users can save their favorite trips, view them later, and share them with others via a unique link.

---

### 🚀 Live Demo

**Try Voyara live:** [**`voyara-x4zm`**](https://voyara-x4zm.vercel.app/)

---

### ## 🌟 Features

* **AI-Powered Itinerary Generation:** Leverages Google's Gemini AI (`gemini-1.5-flash-latest`) to create unique, creative, and detailed travel plans.
* **Customizable Trip Length:** Users can specify the exact number of days for their itinerary.
* **Vibe-Based Planning:** Select from various "vibes" (e.g., Adventure, Relaxing, Foodie) to tailor the plan.
* **Specific Timings:** Itineraries include specific times for activities, not just general blocks (e.g., "9:00 AM" instead of "Morning").
* **Real-time Streaming:** AI responses are streamed word-by-word for a dynamic and engaging user experience.
* **Structured JSON Output:** The backend instructs the AI to return a reliable JSON object.
* **Elegant Card-Based Display:** Parsed itineraries are presented in a clean, easy-to-read, card-based format with icons.
* **User Authentication:**
    * Secure sign-up and login with email/password.
    * Social logins via Google & GitHub.
    * Email confirmation for new accounts (via custom SMTP setup).
    * Password reset functionality.
* **Save Itineraries:** Logged-in users can save their generated itineraries to their personal account.
* **"My Trips" Page:** A dedicated page for users to view and manage all their saved itineraries.
* **Share Itineraries:** Users can generate unique, public links to share their saved itineraries with anyone.
* **Copy to Clipboard:** Easily copy the main details of a generated itinerary.
* **Responsive UI:** Built with Next.js and Tailwind CSS for a seamless experience on desktop and mobile devices.
* **Modern Loading States:** Includes skeleton loaders for a professional feel while data is being fetched.

---

### ## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** JavaScript
* **Styling:** Tailwind CSS
* **Database & Auth:** Supabase (PostgreSQL, Authentication, Custom SMTP for emails)
    * `@supabase/ssr` for server-side auth and client integration.
    * `@supabase/auth-ui-react` for pre-built login/signup forms.
* **AI:** Google Gemini API (`gemini-1.5-flash-latest`) via `@google/generative-ai`
* **Deployment:** Vercel
* **UI Components & Icons:** `lucide-react`

---

### ## ⚙️ Getting Started & Local Development

To run Voyara locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/voyara.git](https://github.com/YOUR_USERNAME/voyara.git) 
    # Replace YOUR_USERNAME/voyara.git with your actual repository URL
    cd voyara
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    * Create a file named `.env.local` in the root of the project.
    * Add your API keys and Supabase URLs to this file:
        ```env
        NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
        NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_PUBLIC_KEY"
        GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
        ```

4.  **Set up Supabase:**
    * Create a Supabase project.
    * In the "Table Editor," create an `itineraries` table with the following schema:
        * `id` (uuid, primary key, default: `gen_random_uuid()`)
        * `created_at` (timestamptz, default: `now()`)
        * `user_id` (uuid, foreign key to `auth.users.id`)
        * `destination` (text)
        * `itinerary_data` (jsonb)
    * Configure Authentication settings in Supabase:
        * Enable Email/Password, Google, and GitHub providers.
        * Set up your OAuth credentials for Google and GitHub.
        * In "URL Configuration," set your **Site URL** to `http://localhost:3000` for local development.
        * Add `http://localhost:3000/auth/callback` to your **Redirect URIs**.
        * Set up a **Custom SMTP** provider for reliable email delivery (for email confirmations, password resets).

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

---

### ## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/karthikurao/voyara/issues). 
---

### ## 📝 License

This project is licensed under the MIT License - see the `LICENSE.md` file for details. 
