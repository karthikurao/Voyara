# ✨ Voyara - AI Weekend Itinerary Generator

Voyara is a sleek, modern web application that crafts personalized weekend travel itineraries in seconds. Simply provide a destination and a desired "vibe," and our AI-powered planner will generate a detailed, day-by-day schedule, streamed to you in real-time.

**(Recommended: Add a GIF of your app working here! A great free tool for this is ScreenToGIF)**

![Voyara Demo](https://user-images.githubusercontent.com/your-username/your-repo/your-gif.gif) 

### 🚀 Live Demo

**Try it out live:** [**voyara.vercel.app**](https://voyara.vercel.app) *(replace with your actual Vercel URL if different)*

---

### ## 🌟 Features

- **AI-Powered Generation:** Leverages Google's Gemini AI to create unique and creative itineraries.
- **Real-time Streaming:** AI responses are streamed word-by-word for a dynamic, live user experience.
- **Structured JSON Output:** The backend instructs the AI to return a reliable JSON object, which is then parsed into a beautiful UI.
- **Vibrant, Responsive UI:** Built with Next.js and Tailwind CSS for a seamless experience on any device.
- **Card-Based Display:** Itineraries are presented in a clean, easy-to-read format with icons.
- **Copy to Clipboard:** Easily copy the generated plan to share with friends.

---

### ## 🛠️ Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (`gemini-1.5-flash-latest`)
- **Deployment:** Vercel
- **Libraries:** `lucide-react` (for icons)

---

### ## ⚙️ Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/voyara.git](https://github.com/your-username/voyara.git)
    cd voyara
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    - Create a file named `.env.local` in the root of the project.
    - Add your Google AI API key to this file:
      ```
      GOOGLE_API_KEY="YOUR_API_KEY_HERE"
      ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.
