# Specification

## Summary
**Goal:** Remove the 14-day drinks-per-day bar chart from the Dashboard UI.

**Planned changes:**
- Remove the Dashboard rendering of the `<DrinksChart />` section so the “14-Day History” card is no longer shown.
- Ensure the remaining Dashboard sections still render correctly without layout issues (UnifiedHeaderSection, ChanceOfDrinkingCard, CycleWindowCard, SoberDaysSection, StatusIndicatorsSection).

**User-visible outcome:** The Dashboard no longer displays the drinks-per-day history chart, while all other Dashboard widgets remain visible and functional.
