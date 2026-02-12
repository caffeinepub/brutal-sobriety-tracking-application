# Specification

## Summary
**Goal:** Add a full-screen streak achievement flow that triggers once per streak target, forces the user to pick a next target, and persists completion state via a profile flag.

**Planned changes:**
- Backend: Add persistent profile flag `achievementShownForThisTarget: boolean` to the profile view and ensure it round-trips through existing profile read/save APIs.
- Frontend: Trigger a full-screen achievement overlay when `streakCurrent >= streakTarget` and `achievementShownForThisTarget` is false, both immediately after a qualifying daily check-in and on next login for already-eligible users.
- Frontend: Implement the first full-screen panel with brutal dark styling (grainy black background, neon pink accents, slow pulse/glow behind the streak number), short dark-humor message (≤3 lines), and a single required action button labeled exactly “SHUT UP!” (no close icon).
- Frontend: After “SHUT UP!”, show a second full-screen panel titled exactly “Do you want to try again?” requiring selection of one target option: “2 days”, “5 days”, “1 week”, “2 weeks”, “1 month”.
- Frontend + Backend: On target selection, persist the new `streakTarget` (same field used by onboarding), reset `achievementShownForThisTarget` to `false`, close the overlay with a fade transition back to the dashboard, and extend existing streak reset behavior so it also resets when the user achieves their target.

**User-visible outcome:** When a user reaches/exceeds their streak target, they are blocked by a brutal full-screen achievement sequence until they press “SHUT UP!” and choose a new streak target; the flow reliably reappears until completed and then stays gone for that target.
