# HOMEX Production

HOMEX is a production-oriented web app for coordinating post-discharge elder care at home.

## Stack

- Next.js app router
- Supabase Auth, Postgres, Storage, and row-level security
- Role-based care circles: family lead, family member, home aide, agency coordinator, clinician
- Care workflows: discharge plan, tasks, medication schedule, visits, shifts, notes, documents, caregiver videos

## Run locally

```powershell
cd C:\Users\delig\Documents\Codex\2026-06-15\i-m-looking-for-a-startup\outputs\homex-production
copy .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Create a Supabase project, paste the values into `.env.local`, then run `supabase/schema.sql` in the Supabase SQL editor.

You can also run the app without Supabase while you are testing the design. The dashboard will use demo data until Supabase environment variables are added.

If you already ran the original schema before invite links were added, run `supabase/upgrade-auth-admin-invites.sql` once in the Supabase SQL editor.

If you already ran the schema before task completion tracking was added, run `supabase/upgrade-task-completion.sql` once in the Supabase SQL editor. This enables live task checkboxes and records who checked each task.

If you already ran the schema before the product-core dashboard was added, run `supabase/upgrade-product-core.sql` once in the Supabase SQL editor. This enables activity summaries and indexes for medications, appointments, contacts, and documents.

## Free demo link

The easiest free way to share this project is Vercel:

1. Create a free GitHub account if you do not already have one.
2. Create a new GitHub repository for this project.
3. Upload or push this folder to that repository.
4. Create a free Vercel account at https://vercel.com.
5. In Vercel, choose Add New Project, then import the GitHub repository.
6. Keep the default Next.js settings and click Deploy.
7. Vercel will give you a public link like `https://homex-production.vercel.app`.

For a design/demo link, you can deploy without Supabase environment variables. For real sign-in, database, storage, and private video uploads, add these Vercel environment variables after creating a Supabase project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPERADMIN_EMAILS`

## Superadmin Access

There is no hardcoded superadmin password. Create a normal account with your chosen admin email, then set this Vercel environment variable:

```text
SUPERADMIN_EMAILS=your-email@example.com
```

After redeploying, sign in with that same email and open `/superadmin`.

Use these credentials in practice:

```text
Superadmin email: the email listed in SUPERADMIN_EMAILS
Superadmin password: the password you created on the HOMEX sign-up page
Superadmin URL: https://your-vercel-site.vercel.app/superadmin
```

Do not commit a real password to GitHub. Supabase stores the password securely through Auth.

## Production deployment

1. Create Supabase project.
2. Run `supabase/schema.sql`.
3. Create a private Supabase Storage bucket named `care-files`.
4. In Supabase Auth, add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
5. Add environment variables to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `SUPERADMIN_EMAILS` as a comma-separated list, for example `founder@example.com`
6. Deploy the Next.js app.

Do not use the service role key in browser code. It is only for trusted server routes.

## Caretaker Videos

HOMEX supports two video paths:

- Embedded caregiver videos via `embed_url`, useful for agency-hosted training on YouTube/Vimeo/Mux.
- Private uploaded videos through `/api/care-videos/upload`, stored in the private `care-files` bucket and played through short-lived signed URLs.

For a serious production launch, use Mux or Cloudflare Stream for transcoding and adaptive playback. Supabase Storage is good for first version uploads, but raw MP4 playback can be heavy on mobile networks.

## PWA And Mobile Direction

HOMEX now includes a basic installable PWA layer:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- app icons and Apple mobile web app metadata

This makes the app installable from supported mobile browsers. It still needs internet for private dashboard data. Offline data sync, push notifications, camera scanning, voice notes, and native app-store wrappers are future work.

## Product Roadmap Priority

1. Member management + activity log.
2. Medications + appointments.
3. PWA/mobile install.
4. Documents + emergency card.
5. Agency dashboard.
6. Notifications/reminders.
7. AI summaries and document extraction.

## Larger Product Feature Set

- Multiple care circles per user.
- Medication schedule and refill tracking.
- Appointment calendar.
- Emergency profile card.
- Document vault.
- Care notes timeline.
- Family invite links and member management.
- Activity log showing who did what.
- Caregiver video library.
- Agency dashboard for managing many care recipients.
- Aide shifts, clock-in/out, and handoff notes.
- Push notifications and reminders.
- PWA install, offline emergency card, native app wrapper later.
- AI summaries, discharge-paper extraction, and smart reminders later.

## What Is Production-Ready Here

- Real database schema with row-level security.
- Magic-link auth.
- Email/password sign up and sign in.
- Superadmin access controlled by `SUPERADMIN_EMAILS`.
- Invite links generated by the family lead so trusted family members join the correct care circle.
- Installable PWA shell with offline fallback page.
- Medication, appointment, document, contact, emergency-card, and activity-log dashboard sections.
- Care circle onboarding.
- Role-aware tables for family leads, family members, aides, agency coordinators, and clinicians.
- Private caregiver video upload endpoint.
- Signed playback URLs for stored videos.
- Server actions for tasks, notes, and embedded videos.
- Security headers in `next.config.ts`.

## Still Needed Before Public Launch

- Legal review for healthcare claims and privacy language.
- HIPAA posture if selling to covered entities or handling PHI on behalf of providers.
- Error monitoring such as Sentry.
- Email invite flow for family/aides.
- Payment system.
- Automated tests and CI.
- Video transcoding provider for large uploads.
