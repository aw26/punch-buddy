# The Punch Buddy Development Workflow (Best Practices)

This document outlines the "Gold Standard" process for taking an idea from your brain to the live product.

## 1. Plan & Spec (The "Blueprint")
Before touching code, define *what* we are building.
*   **Update `task.md`**: Add the feature to your checklist.
*   **Update `PRODUCT_SPEC.md`**: If it changes the core behavior, document it.
*   **Why?**: Prevents "feature creep" and confused logic.

## 2. Code (The "Construction")
*   Write your code.
*   Keep changes focused. Don't refactor the entire app while adding one button.

## 3. Verify (The "Inspection")
*Before* you commit, proof your work.
*   **Manual Test**: Click the buttons. Does it work?
*   **Regression Check**: Run through `REGRESSION_CHECKS.md`. Did we break the Login? Did we break Mobile?
*   **Build Test**: Run `npm run build` in your terminal.
    *   *Why?* It acts as a "syntax spellchecker". If there's a typo, the build fails here (cheap) instead of in production (expensive).

## 4. Document (The "Logbook")
*   **Update `CHANGELOG.md`**: Before you commit, add a line about what you fixed/added under the `[Unreleased]` or new Version section.
*   **Why?**: Future-you will thank present-you when trying to figure out "When did we fix that bug?".

## 5. Commit (The "Save Point")
Once verified and documented, save your progress.
*   `git add .` (Stage files)
*   `git commit -m "feat: meaningful message"`
*   *Tip*: Commit often. "feat: add button" is better than "feat: add button and fixing login and huge refactor".

## 5. Push & Deploy (The "Launch")
*   `git push`
*   **GitHub Actions**: This project handles the rest automatically. It sees the push, runs the build, and deploys to the live URL.

## 6. Live Check (The "Sanity Check")
*   Go to the production URL.
*   Refresh (Hard Refresh if needed).
*   Verify the new feature works in the wild.

---
**Summary Checklist before Pushing:**
1. [ ] Specs Updated?
2. [ ] Code Written?
3. [ ] `npm run build` passed?
4. [ ] `REGRESSION_CHECKS.md` passed?
5. [ ] Committed?
6. [ ] **PUSH!** 🚀
