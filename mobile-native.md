# HOMEX native app wrapper

HOMEX is already a PWA. For App Store and Play Store distribution, wrap the live Vercel site with Capacitor.

## Setup

1. Install native tooling locally:
   `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`

2. Set the live app URL:
   `CAPACITOR_SERVER_URL=https://your-vercel-url.vercel.app`

3. Add native platforms:
   `npx cap add ios`
   `npx cap add android`

4. Sync changes:
   `npx cap sync`

5. Store accounts:
   Apple Developer Program is currently 99 USD/year.
   Google Play Console has a one-time registration fee, commonly 25 USD.

The wrapper uses `capacitor.config.ts`. Keep the PWA working first, then submit the native wrapper when the care-circle flows are stable.
