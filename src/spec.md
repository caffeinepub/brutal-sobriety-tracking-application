# Specification

## Summary
**Goal:** Add a frontend-only Feedback Matrix Inspector to view message and sentence counts per unique user-input combination from `feedbackMatrix.json`.

**Planned changes:**
- Create a “Feedback Matrix Inspector” view that loads `frontend/public/feedbackMatrix.json` using the existing `loadFeedbackMatrix()` loader.
- Group matrix entries by (ageRange, motivation, baselineTier, secondarySubstance) and display, for each group, the group key and total message count.
- For each message, display the message text and a deterministic frontend-computed sentence count; also show a per-group total sentence count.
- Add a developer-only access path (e.g., `#/debug/feedback-matrix` route or `?debug=feedback-matrix` flag) that is not exposed in normal user flows.
- Render a clear English error state when the matrix fails to load, without crashing the app.

**User-visible outcome:** Developers can navigate directly to a hidden inspector screen to see message counts and sentence counts per user-input combination, with a safe error display if the matrix cannot be loaded.
