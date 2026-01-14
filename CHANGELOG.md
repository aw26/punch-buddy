# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2026-01-14

### Added
-   **Collaborative Celebration Flow**:
    -   Completed collaborative cards now display a "Click to Celebrate! 🎉" button instead of auto-archiving.
    -   Celebration Overlay now includes a "Reward Reveal" (Title + Reward text) and visible Close button.
    -   Archiving is now an explicit secondary action ("Archive for everyone").
-   **PWA Audio Fix**: Added logic to wake up the sound engine every time the app returns to the foreground (fixes sound dying after minimizing app on iOS).
-   **Documentation**: Detailed `PRODUCT_SPEC.md` and `TECHNICAL_SPEC.md`.

### Changed
-   **Create Card Flow**: Renamed "I'll share later" to bold "Done" button in Success Modal.
-   **Copy Confirmation**: Clarified text to "Copy and add to your own cards?".

### Fixed
-   **"Ghost Archive" Bug**: Fixed a database permission (RLS) issue where collaborators could not update card status.
-   **Celebration Trap**: Fixed overlay having no exit button.
-   **HabitContext**: Fixed potential infinite loop in `fetchHabits`.

## [0.5.0] - 2026-01-04 - PWA Hardening
### Fixed
-   **PWA Audio**: Hardened audio context unlocking for iOS PWA to ensure sounds play correctly (using oscillator unlock technique).

## [0.4.0] - 2026-01-03 - Profiles & Social Polish
### Added
-   **User Profiles**: Profile picture upload with cropping and display on Shared Cards.
-   **Shared Card UI Refresh**: Larger fonts, sparkle effects, and creator profile links.

### Fixed
-   **Mobile UI**: Fixed invisible text in collaborator lists and improved celebration on smaller screens.
-   **Collab Duplication**: Fixed a bug where collaborative completion triggered duplicate events.
-   **Invite UI**: Improved the collaborator invite flow visuals.

## [0.3.0] - 2025-12-24 - Production Stability
### Fixed
-   **Supabase Config**: Fixed API key environment variable issues in production.
-   **Auth Redirects**: Corrected Magic Link redirect URLs for GitHub Pages hosting.

## [0.2.0] - 2025-12-23 - CI/CD & Deploy
### Added
-   **GitHub Actions**: Workflow for auto-deployment to GitHub Pages.
-   **Production Config**: Updated Vite config for correct base paths.

## [0.1.0] - 2025-12-23 - Initial Release
-   Initial commit of Punch Buddy (formerly PunchTime).
-   Core features: Create, Punch, Archive.
-   Offline-first architecture with rudimentary Supabase sync.
