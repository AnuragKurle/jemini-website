# Backend & Account Requirements Scope (Bare Minimum)

## 1. Overview
This document outlines the **bare minimum** backend and account requirements to functionalize the Knote application. The goal is to enable user accounts, secure login, and persistent game progress (unlocking remedies) without over-engineering.

## 2. Core Features to Support
1.  **User Accounts:** Users must create an account to save their progress.
2.  **Remedy Locking/Unlocking:** The game has a progression system. Users start with one remedy unlocked. Winning a game unlocks the next remedy. This state must be saved.
3.  **Game Data Management:** Remedy data (symptoms, emojis) should be served from the backend to allow updates without modifying the frontend code.

## 3. Authentication Requirements
*   **Sign Up:**
    *   Fields: Email, Password.
    *   Validation: Valid email format, minimum password length.
*   **Login:**
    *   Fields: Email, Password.
    *   Mechanism: Return a secure token (JWT) or set a Session Cookie.
*   **Logout:**
    *   Invalidate token/session.
*   **Protection:**
    *   All game progress endpoints must require a valid login token.

## 4. Database Schema (Conceptual)
We need a simple database structure. A NoSQL document store (like MongoDB) or a relational DB (PostgreSQL/SQLite) works.

### A. Users Collection/Table
*   `id`: Unique Identifier
*   `email`: String (Unique)
*   `password_hash`: String (Encrypted)
*   `created_at`: Timestamp

### B. Remedies Collection/Table (Static Data)
*   `id`: Unique Identifier (e.g., "cina", "atheusa")
*   `name`: String (Display Name)
*   `order`: Integer (To determine unlock sequence)
*   `game_data`: JSON/Array (The pairs of Text + Emojis)
    *   *Example:* `[{ "text": "Worm Remedy", "emoji": "🐛" }, ...]`

### C. UserProgress Collection/Table
*   `user_id`: Link to User
*   `unlocked_remedy_ids`: Array of Strings (List of IDs the user has unlocked)
    *   *Default:* `["atheusa"]` (or whatever the first one is)
*   `completed_games`: (Optional - Bare Minimum) Log of completed games if we want to track stats later. For now, `unlocked_remedy_ids` is sufficient.

## 5. API Endpoints (Bare Minimum)

### Auth
*   `POST /api/auth/signup`
    *   Input: `{ email, password }`
    *   Output: `{ token, user_id }`
*   `POST /api/auth/login`
    *   Input: `{ email, password }`
    *   Output: `{ token, user_id }`

### Data & Game State
*   `GET /api/remedies`
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Logic:** Returns the list of all remedies. The backend checks the user's `unlocked_remedy_ids` and adds a `locked: boolean` flag to each remedy in the response.
    *   **Output:** `[ { "id": "atheusa", "name": "Atheusa", "locked": false }, { "id": "cina", "name": "Cina", "locked": true }, ... ]`

*   `GET /api/remedies/:id`
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Logic:** Returns the specific `game_data` (cards) for the requested remedy.
    *   **Output:** `[ { "text": "...", "emoji": "..." }, ... ]`

*   `POST /api/progress/unlock`
    *   **Headers:** `Authorization: Bearer <token>`
    *   **Input:** `{ remedy_id: "cina" }` (The remedy just completed)
    *   **Logic:** Backend verifies completion (trusting client for bare minimum, or validating moves if we want more security). Finds the *next* remedy in the sequence and adds it to the user's `unlocked_remedy_ids`.
    *   **Output:** `{ success: true, new_unlocked_id: "borax" }`

## 6. Tech Stack Recommendation
*   **Backend:** Node.js with Express (Lightweight, JavaScript-based like the frontend).
*   **Database:** MongoDB (Great for storing the JSON-like game data structure) OR SQLite (Zero-config, file-based, easy for small apps).

## 7. Hosting & Deployment Strategy (Free/Cheap Options)

Since you are new to hosting, we have two main paths.

### Path A: "Backend-as-a-Service" (Recommended for Beginners)
Use a platform that handles the Database, Authentication, and Hosting all in one place.
*   **Platform:** **Firebase** (by Google) or **Supabase**.
*   **Cost:** Generous **Free Tier** (usually enough for thousands of users).
*   **Pros:**
    *   No need to write a separate "server" code for Auth (it's built-in).
    *   Database is hosted and managed for you.
    *   Hosting the frontend is one command (`firebase deploy`).
*   **Cons:** specific syntax to learn (vendor lock-in).

### Path B: Traditional "Frontend + Backend" (More Control)
We host the frontend and backend separately on services that specialize in each.
*   **Frontend Hosting:** **Vercel** or **Netlify**.
    *   **Cost:** Free for personal projects.
    *   **How:** Connect your GitHub repository. It automatically builds and deploys when you push code.
*   **Backend Hosting:** **Render** or **Railway**.
    *   **Cost:** **Render** has a free tier (but the server "sleeps" after inactivity, causing a delay on the first request). **Railway** has a small trial/fee.
    *   **Pros:** Standard Node.js code, easy to move elsewhere later.
    *   **Cons:** Managing two separate services.

### Recommendation
For this project ("Knote"), **Path A (Firebase)** is likely the easiest to get started with because it handles Authentication and Database out-of-the-box, saving us from writing a lot of custom backend security code.

However, if you want to learn how to build a "real" custom backend API (which is a valuable skill), **Path B** is better.

**Deployment Steps (General):**
1.  **Code:** Move our single HTML file into a proper project structure (React App).
2.  **Git:** Put the code on GitHub.
3.  **Connect:** Link GitHub to the hosting provider (e.g., Vercel).
4.  **Launch:** The provider gives you a live URL (e.g., `knote-game.vercel.app`).
