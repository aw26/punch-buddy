# Regression Testing Checklist

Use this checklist before every major release or commit to ensure no existing functionality has been broken.

## 1. The Core Loop (Personal)
- [ ] **Create Card**: Create a new personal card. Verify title, reward, icon, and color persist.
- [ ] **Punching**: Punch 3 slots quickly. Reload page. Verify punches persist.
- [ ] **Un-punch**: Tap the last filled slot. Verify it un-fills.
- [ ] **Completion**: Punch the final slot. Verify Celebration Overlay appears (Sound + Confetti).
- [ ] **Archiving**: Click "Archive". Verify card moves to Archive tab.

## 2. Collaboration Flow (The Critical Path)
- [ ] **Invite**: Create a collab card with an invite email. Copy link.
- [ ] **Join**: Open link in Incognito (or as User B). Verify "Join" prompt appears.
- [ ] **Shared Punching**: User A punches. Verify User B sees the update (Realtime/Refresh).
- [ ] **Collab Completion**: User A finishes the card. Verify User B sees the "Click to Celebrate" button.
- [ ] **Collab Archiving**: User B clicks "Archive for everyone". Verify it moves to Archive for **both** users.

## 3. Authentication & Profile
- [ ] **Login**: Login with Magic Link/OTP. Verify redirection to Dashboard.
- [ ] **Logout**: Click Logout. Verify redirection to Login page.
- [ ] **Profile**: Change avatar or display name. Verify it updates on a Shared Card.
- [ ] **Guest Mode**: Open a public card without logging in. Verify you can view but NOT punch.

## 4. UI & responsiveness
- [ ] **Mobile View**: Check card grid on mobile width. Ensure "Punch" targets are tap-friendly.
- [ ] **Modals**: Open "New Habit", "Success", and "Celebration" overlays. Verify "X" or "Dismiss" works.
- [ ] **PWA**: (If testing on device) Verify app opens without browser chrome and session persists.

## 5. Security (RLS Checks)
- [ ] **Guest Protection**: Try to punch a card as a guest. Should fail (or prompt login).
- [ ] **Follower Protection**: Follow a card. Try to punch it. Should fail.
- [ ] **Data Isolation**: Verify you cannot see "Private" cards of other users in any list.
