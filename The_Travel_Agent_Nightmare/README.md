# Hackathon
# 🗺️ The Ultimate Itinerary: The Travel Agent Nightmare

## 2. Short Description
The Ultimate Itinerary is a chaotic puzzle game inspired by "The Password Game" where players take on the role of a stressed travel agent. The objective is to build a valid vacation itinerary, but every successful addition unlocks increasingly unhinged, conflicting, and live-updating travel rules. Players must juggle alphabetical chains, live global weather shifts, and real-time fluctuating currency crashes to successfully check out their clients.

## 3. Tech Stack
*   **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
*   **APIs Used:** 
    *   [Open-Meteo API](https://open-meteo.com) (Live real-time weather data)
    *   [Frankfurter API](https://frankfurter.app) (Live currency exchange rates)
    *   [REST Countries API](https://restcountries.com) (Global city, flag, and currency mapping)
*   **State Management & Persistence:** Browser `LocalStorage`
*   **Asynchronous Patterns:** Async/Await, Fetch API, and `setInterval` loops

## 4. How to Run the Project

### Prerequisites
You only need a modern web browser installed.

### Step-by-Step Setup
1.  **Clone the Repository:**
    git clone git@github.com:stolovitskyinc-maker/Hackathon.git
    ```
2.  **Open the Project:**
    *   Simply double-click the `index.html` file in your file explorer to open it in your browser.
    *   *Alternative (Recommended for hot-reloading):* If using VS Code, right-click `index.html` and select **"Open with Live Server"**.

3.  **Environment Variables:**
    *   No configuration or `.env` files are required. All APIs used are public and open-source.

## 5. Main Features
*   **Dynamic Itinerary Builder:** Drag, drop, or click to add global destination cities into a visual DOM timeline tracker.
*   **Cascading Rules Validation:** A rule-checking engine that instantly validates your travel path as you play.
*   **Live Weather Integration:** Fetches real-time environmental data to ensure your itinerary alternates between hot and cold climates.
*   **Economic Market Chaos (`setInterval`):** Simulates real-time market fluctuations that dynamically break your financial currency rules while you are actively building the trip.
*   **Autosave Progress:** Leverages `LocalStorage` to save your highest unlocked level and current itinerary layout so progress isn't lost on a page refresh.

## 6. Team Members
*   Yaakov Stolovitsky — Lead JavaScript Developer / Chaos Engineer
