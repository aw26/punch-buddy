# Punch Buddy - Technical Specification

## 1. Technology Stack
-   **Frontend**: React (v18), Vite, CSS Modules (Vanilla CSS/Variables).
-   **Language**: JavaScript (moving toward JSDoc/Typescript for safety).
-   **Backend / BaaS**: Supabase.
    -   **Database**: PostgreSQL.
    -   **Auth**: Supabase Auth (Magic Link, OTP).
    -   **Realtime**: Supabase Realtime (Postgres Changes) for instant updates.
-   **Hosting**: Static Web App (e.g., Vercel/Netlify support compatible).
-   **PWA**: Web Manifest & Service Workers for "Add to Home Screen" capability.

## 2. Architecture & Data Model

### Data Flow
-   **Context-Based State**: `HabitContext` manages the global state of cards.
-   **Optimistic UI**: The app updates local state *immediately* upon interaction (Punch, Archive, Comment), then synchronizes with Supabase. If the DB rejects the change (e.g., RLS error), the UI rolls back (or should).
-   **Offline-First (Partial)**: `loadHabits()` checks LocalStorage first (for Guests), then attempts to fetch from Supabase (for Auth Users).

### Key Tables
1.  **cards**: The parent object. Contains `title`, `punch_count`, `creator_id`, `mode` (personal/collab), `archived`.
2.  **punches**: Time-series log of punches. `card_id`, `user_id`, `punched_at`. Count is derived or cached.
3.  **collaborators**: Join table `(card_id, user_id)` granting write access.
4.  **followers**: Join table `(card_id, user_id)` granting read/comment access.
5.  **comments**: Chat/social interaction on cards.

## 3. Security & Access Control (RLS)
We use PostgreSQL **Row Level Security (RLS)** to enforce permissions:
-   **SELECT**:
    -   Public cards: Open to all? (Currently strict).
    -   Private cards: Visible to Creator, Collaborators, and Followers.
-   **INSERT (Punches)**:
    -   Allowed for Creator and Collaborators.
-   **UPDATE (Cards)**:
    -   Allowed for Creator and Collaborators (recently updated to allow "Archive for Everyone").

## 4. Risks & Scalability Concerns

### Scalability
-   **No Pagination**: `fetchHabits` currently loads *all* user cards. As history grows (100+ archived cards), startup time will degrade.
    -   *Mitigation*: Implement pagination or "Archive" lazy-loading.
-   **Realtime Connections**: Opens a socket for every user. Supabase has limits on concurrent connections on free tier.

### Security
-   **Invite Links**: Currently share via URL parameters or direct ID. If we move to "Secret Links" for viewing private cards without login, we need a secure token system.
-   **Optimistic Conflicts**: Two collaborators punching the *last* slot simultaneously might trigger double-celebration or a race condition. Currently "last write wins" or both get recorded.

### Reliability
-   **PWA Session Management**: Users report frequent logouts. Token refresh logic in `AuthContext` needs auditing against iOS Safari aggressive background killing.
