# Specification

## Summary
**Goal:** Expand the “brutal friend” motivational quote pool with 30+ new English quotes that keep the same cheeky, brutally friendly tone while explicitly covering age, other drugs/habits (including games and porn), family, health, and sports performance.

**Planned changes:**
- Append 30+ new unique “brutal friend” motivational quotes to the backend quote list used by the motivation/feedback message generator (backend/main.mo).
- Update the frontend fallback brutal message list in the motivation dialog (frontend/src/components/BrutalFriendDialog.tsx) to include the same expanded quote pool for consistency when backend messages are missing/empty.

**User-visible outcome:** Users will see a wider variety of brutally friendly motivational messages, with new lines that reference age, habits/drugs (including games and porn), family, health, and sports performance—both from the backend and as UI fallbacks.
