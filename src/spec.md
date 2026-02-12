# Specification

## Summary
**Goal:** Integrate the Usergeek tracking snippet into the frontend HTML entry point and configure it with the provided API key.

**Planned changes:**
- Add the standard Usergeek tracking snippet to `frontend/index.html` (in `<head>` or immediately before `</body>`), preserving existing metadata and the `/src/main.tsx` module script tag.
- Configure the snippet to use API key `014402022A34A8626A6C124A58B6197F` exactly as provided.
- Verify the app loads the Usergeek tracking script at runtime without console errors caused by the integration.

**User-visible outcome:** When the app is run in a browser, the Usergeek tracking script loads successfully and starts tracking based on the configured API key.
