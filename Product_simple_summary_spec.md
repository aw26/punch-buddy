# Punch Buddy - Product Specification

## 1. Vision & Goal
**Punch Buddy** is a delightful, social habit-tracking application that reimagines the nostalgic "Buy 10, Get 1 Free" loyalty card as a tool for personal goals and shared achievements.
**Core Philosophy:** Habit tracking should be fun, tactile, and social, not a chore. We prioritize "delight" (animations, sounds, jewel tones) over rigid productivity metrics.

## 2. Core Behaviors (The "Loop")
The user journey revolves around the **Punch Card**:
1.  **Create**: User designs a card (Habit Name, Reward, Icon, Color, Sound).
2.  **Punch**: User taps a slot to mark progress. This triggers feedback (sound/haptics).
3.  **Celebrate**: Upon filling the card (e.g., 10/10), a celebration occurs (Confetti, Reward Reveal).
4.  **Redeem & Archive**: The user "redeems" their reward and archives the card, often starting a new one.

## 3. Core Product Areas

### A. The Punch Card (Atomic Unit)
-   **Visuals**: "Frosted Glass" aesthetic, vibrant jewel tones (Ruby, Sapphire, Emerald, Gold).
-   **Interaction**: Tactile punching (holes "punched" out), satisfying sounds (Airhorn, Ding, Confetti).
-   **Customization**: Users express identity through icon/color choices.

### B. Social & Collaboration
-   **Collaborative Mode**: multiple users contribute to *one* card (e.g., "Team Lunch 0/10").
    -   *Logic*: Any collaborator can punch. Progress is shared. Real-time updates.
-   **Social Following**: Users can "Follow" friends' personal cards.
    -   *Logic*: Followers can view and "Cheer" (send emoji reactions/comments) but cannot punch.
    -   *Discovery*: Invite Links allow deep-linking to specific cards.

### C. Rewards & Gamification
-   **Rewards**: Customizable text (e.g., "Buy myself a latte") revealed upon completion.
-   **Streaks**: Visual indicators ("🔥 3 day streak") to encourage consistency.
-   **Celebration Overlay**: immersive, full-screen animation when a goal is met.

## 4. Feature Wishlist (Future)
-   **Wallet View**: visually stacking cards like a digital wallet.
-   **Communities**: Discovering cards by category.
-   **Notifications**: "Angela just punched 'Gym'!"
-   **Group Emails**: Automated summary emails for finished collab cards.
