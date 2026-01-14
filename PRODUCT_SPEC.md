# Punch Buddy - Detailed Product Specification

> **Status:** Active / In Development
> **Last Updated:** 2026-01-14

## 1. Product Philosophy & North Star
**Punch Buddy** is a "Hyper-Social, Tactile Loyalty Card" for friends.
Unlike productivity trackers (which feel like work) or habit apps (which feel solitary), Punch Buddy mimics the physical joy of a "Buy 10, Get 1 Free" card from a coffee shop, but applied to friend-groups and personal goals.

**Core Values:**
1.  **Delight over Data**: We prioritize confetti, haptics, and aesthetics over graphs or stats.
2.  **Tactile UI**: Buttons should feel like they "punch" (skeuomorphic depth, sound feedback).
3.  **Low Friction**: No login required to view a card (Guest Mode). "One-tap" interaction.

---

## 2. Comprehensive User Flows

### A. Authentication & Onboarding
**Goal:** Minimally invasive auth. Get to the "Punching" as fast as possible.
1.  **Landing**:
    -   If unauthenticated, show "Punch Buddy" logo + "Login / Sign Up".
    -   **Guest Mode**: If following a shared link, user enters as "Guest" (LocalStorage only) until they try to punch a protected card.
2.  **Login Flow**:
    -   **Magic Link / OTP**: User provides Email. System sends 6-digit code.
    -   *Why*: No password fatigue. Secure.
3.  **Profile Creation**:
    -   Prompt for **Display Name** and **Avatar** (Upload/Crop).
    -   *Constraint*: Required for Collaboration (so people know who "Lala" is).

### B. Card Creation Flow (The "Printer")
1.  **Entry**: Floating Action Button (+) -> "New Habit".
2.  **Configuration**:
    -   **Habit Name**: Required (e.g., "Gym Connect").
    -   **Reward**: Required (e.g., "KBBQ Dinner"). The carrot at the stick's end.
    -   **Visuals**: Icon Grid (Emoji-based) + Color Picker (Limited "Jewel Tone" Palette: Ruby, Sapphire, etc to ensure beauty).
    -   **Frequency**: "Total Punches" (Default: 10).
3.  **Mode Selection**:
    -   **Personal**: Just me.
    -   **Collaboration**: "Team" mode.
        -   *Input*: "Add Friends" (Email).
        -   *Logic*: Creating this card sends invites *immediately* (or generates links).
4.  **Success State**:
    -   "Card Created!" Modal.
    -   **CTA**: "Copy Link" to share immediately.
    -   **Exit**: "Done" button returns to Home.

### C. The Punching Loop (The Core)
1.  **View**: Card displayed in 5-column grid.
2.  **Action**: Tap an empty slot.
    -   *Logic*: Must be "Next available slot" OR any previous slot? -> **Current Rule:** Sequential filling.
    -   *Validation*: Is User Creator or Collaborator? Guests/Followers cannot punch.
3.  **Feedback**:
    -   **Visual**: Hole "punches" out (white circle fills with checkmark/void).
    -   **Audio**: "Punch" sound (paper tear/hole punch).
    -   **Haptic**: (If mobile) Vibration.
4.  **Optimistic UI**: Interface updates instantly. Syncs to Supabase in background.

### C.1. Collaboration Rules
-   **Shared State**: If User A punches slot 3, User B sees slot 3 filled instantly (Realtime).
-   **Notifications**: (Wishlist) User B gets "User A punched [Habit]!"
-   **Concurrency**: usage of "Last Write Wins" logic currently.

### D. Completion & Celebration (The "Payoff")
1.  **Trigger**: User punches the *final* slot (e.g., 10/10).
2.  **Immediate Feedback**:
    -   **Sound**: Selected celebration sound (e.g., "Airhorn", "Angel Chorus").
    -   **Visual**: Full-screen Overlay.
3.  **The Overlay**:
    -   **Confetti**: Particle system (matching card colors).
    -   **Reward Reveal**: "You earned: [Reward Text]".
    -   **Dismiss**: "Click to Celebrate" button allows re-triggering. "X" to close.
4.  **Post-Completion State**:
    -   Card stays in "Active" tab.
    -   Complete banner: "Completed! 🏆".
    -   **Archiving**: User must explicitly click "Archive for everyone" to hide it.

### E. Social Actions
1.  **Share**: Generates unique URL (e.g., `/#/share?id=xyz`).
2.  **Follow**:
    -   User clicks unique URL -> "Follow this card".
    -   Card appears in "Following" tab.
    -   *Permission*: Read-only. Can "Comment/Cheer".
3.  **Clone (Copy)**:
    -   User likes a friend's habit logic.
    -   Click "Copy" -> Creates a *new* Personal card with same Name/Icon/PunchCount.

### F. Commenting
-   **Context**: Each card has a collapsible "Comments" section.
-   **Purpose**: Encouragement ("Go go!", "Almost there!").
-   **Data**: Stored in `comments` table linked to card.

---

## 3. Detailed Data Architecture

### Entities
1.  **Card (`cards`)**:
    -   `id`: UUID.
    -   `mode`: 'personal' | 'collab'.
    -   `punch_count`: integer (target).
    -   `archived`: boolean (global visibility toggle).
    -   `celebration_sound`: string id.
2.  **Collaborator (`collaborators`)**:
    -   `card_id`, `user_id`, `role` (owner/editor).
    -   *Rule*: Grants WRITE access to `punches` table and `archive` status.
3.  **Punch (`punches`)**:
    -   `card_id`, `user_id`, `punched_at` (timestamp).
    -   *Count Logic*: We count rows in this table to determine UI state (0/10). We do *not* rely on a simple counter on the parent card (to prevent drift), although we cache it for performance.

### Security/RLS Matrix
| Actor | Visibility | Punch? | Archive? | Comment? |
| :--- | :--- | :--- | :--- | :--- |
| **Creator** | All | Yes | Yes | Yes |
| **Collaborator** | All | Yes | Yes | Yes |
| **Follower** | Read-Only | No | No | Yes |
| **Guest** | None (unless Public) | No | No | No |

---

## 4. Priorities & Roadmap

### P0: Critical Path (Done)
-   [x] Create/Edit/Delete Cards.
-   [x] Punch mechanics with Auth.
-   [x] Collaboration (Invite & Shared Punching).
-   [x] "Ghost Archive" Fix (Collab Archiving).

### P1: Retention (Next)
-   [ ] **PWA Stability**: Fix session logout issues.
-   [ ] **Notifications Loop**: Crucial for viral loop (Friend punches -> You get notified -> You punch).
-   [ ] **UI Polish**: "Angel's Wallet" view (Visual Ordering).

### P2: Expansion (Later)
-   [ ] **Communities**: Public lists of habits ("Marathon Training", "100 Books").
-   [ ] **Email Digest**: "Your Weekly Punch Summary".
