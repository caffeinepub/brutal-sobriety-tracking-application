# Specification

## Summary
**Goal:** Restore reliable Dashboard daily session modal popups (Daily/Repeat Check-In → Data Logged → Brutal Friend) based on backend status, even when `userProfile` loads after `status`, and provide a manual check-in entry point when no auto-modal is triggered.

**Planned changes:**
- Fix the Dashboard’s centralized daily session flow initialization to re-evaluate once all required inputs (`status`, `userProfile`, `identity`) are available and avoid being permanently blocked by one-time initialization guards when initial inputs are incomplete.
- Ensure the centralized FIFO modal queue reliably opens exactly one modal at a time in the intended order: (Daily/Repeat) → Data Logged → Brutal Friend → end/close.
- Add an obvious, English-labeled manual Dashboard action to start a check-in when the session flow resolves to IDLE, without breaking the existing centralized modal orchestration.

**User-visible outcome:** On Dashboard load, users who need to check in will reliably see the correct check-in popup flow; if no popup appears, users can still start a check-in via a clear manual button/entry point on the Dashboard.
