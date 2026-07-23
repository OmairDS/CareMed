# Care Medical Group — training platform

**File / format:** Next.js 14 app (TypeScript, Tailwind, Prisma) — deployable to Vercel, backed by Neon Postgres.
**Audience:** trainees with no prior coding background, in a single 2-hour session.
**Context:** this is the pre-built starter repo referenced in the Care Medical Group training roadmap. Trainees fork it, deploy it, and connect it to their own database — they don't write code today.

---

## What's already built

- All 5 branches (Rawabi, Malaz, Balad, Harm, Jewar) as real database rows.
- All 4 roles (Admin, Practitioner, Patient, Insurance rep), each with a working dashboard.
- Sample data: 2 practitioners, 2 patients, 1 insurance provider, appointments in different states, a released lab result, a claim under review, and a claim already approved and paid — so every screen has something real to look at immediately after deploying.
- A one-click demo login (no password to remember) — good enough for today's session; building real authentication is a later phase.
- Real "add" actions on every dashboard (all in `lib/actions.ts`, all write to the live database):
  - **Admin:** add a hospital, add a staff member (new staff show up on the login screen immediately, and a duplicate email now shows a real error instead of failing silently)
  - **Patient:** book an appointment with any practitioner
  - **Practitioner:** confirm / mark completed / cancel their own appointments, enter a result for any pending lab test, and raise an insurance claim on any completed appointment that doesn't have one yet
  - **Insurance rep:** approve or deny a claim — approving automatically marks the linked invoice paid and records a payment, showing how claims drive financials
- A **Financials** section on the Admin dashboard — total revenue collected, invoice counts, and a per-branch invoice table, all driven by the same data the claims workflow updates.

## Structure at a glance

| Path | What it is |
|---|---|
| `prisma/schema.prisma` | The full data model: hospitals, users, appointments, lab tests/results, claims, invoices, payments |
| `prisma/seed.js` | Fills the database with demo data automatically on every deploy |
| `app/login/page.tsx` | Lists the seeded demo accounts, one click signs in as that role |
| `app/dashboard/page.tsx` | Reads who's logged in and shows the matching dashboard |
| `components/dashboards/` | One component per role: `AdminDashboard`, `PractitionerDashboard`, `PatientDashboard`, `InsuranceDashboard` |
| `components/Header.tsx` | The Care Medical logo + current role + sign out |
| `lib/actions.ts` | Server actions behind every add/approve button — hospital, staff, booking, lab results, appointment status, claim raising/review |
| `components/forms/AddStaffForm.tsx` | The one form with real validation feedback (`useFormState`) — a pattern worth reusing on the others |
| `public/logo.jpg` | The Care Medical logo used in the header |

## How to use this package — the 2-hour session

1. **Fork this repo** into your own GitHub account.
2. **Import it into Vercel** ("Add New Project" → pick your fork). Vercel deploys it immediately, but it won't work yet — there's no database connected.
3. **Create a free Neon project** and copy its connection string.
4. **In your Vercel project settings → Environment Variables**, add:
   - `DATABASE_URL` = the Neon connection string (make sure it ends in `?sslmode=require`)
5. **Redeploy.** This single redeploy does three things automatically, in order:
   - creates all the tables in your new database (`prisma db push`)
   - fills them with the demo data above (`prisma/seed.js`)
   - builds and publishes the site
6. **Open your live URL and log in** as any of the demo accounts to see that role's dashboard.

If the deploy fails right after adding `DATABASE_URL`, it's almost always a copy-paste issue with the connection string — check for the trailing `?sslmode=require` and that you copied the whole thing.

## Extend this package — natural next additions

- **Phase 1:** replace the one-click demo login with real password-based auth (the `passwordHash` column is already seeded and ready for this).
- **Editing/deleting:** the add forms cover create only — edit and delete for hospitals, staff, and appointments is a natural next step.
- **More validation:** only `addStaff` has real error messages so far (via `useFormState`) — the other forms still fail silently on bad input; worth extending the same pattern.
- **Patient-facing claim/invoice view:** patients see claim status per appointment already, but not the invoice/payment breakdown Admin now sees.
- **Phase 7:** simple charts (e.g. claims approved over time, revenue by branch) instead of the current plain tables.
