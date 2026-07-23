# Connecting everything — GitHub → Vercel → Neon

A click-by-click guide. No coding, no terminal — every step happens in a browser.

**What you'll end up with:** your own live copy of the Care Medical Group platform, at a URL like `care-medical-platform-yourname.vercel.app`, with real demo data already loaded.

---

## Before the session: create 3 free accounts

Do this ahead of time — account signup + email verification is the one part that can eat 20 minutes if done live.

1. **[github.com](https://github.com)** → sign up.
2. **[vercel.com](https://vercel.com)** → sign up using **Continue with GitHub** (keeps everything under one login).
3. **[neon.tech](https://neon.tech)** → sign up, GitHub login works here too.

---

## Step 1 — Fork the starter repo

*"Forking" means making your own personal copy of someone else's GitHub project.*

1. Open the repo link you were given, on GitHub.
2. Click **Fork** — top-right of the page.
3. Leave everything as-is, click **Create fork**.

You now have your own copy at `github.com/YOUR-USERNAME/care-medical-platform`. Nothing you do to it affects the original.

---

## Step 2 — Create your Neon database

*Neon is where all the real data lives — hospitals, appointments, claims, everything.*

1. Go to **neon.tech** and sign in.
2. Click **New Project** (or **Create a project** if it's your first one).
3. Give it any name — e.g. `care-medical` — pick a region near you, click **Create Project**.
4. On the project dashboard, click **Connect**.
5. Leave **Connection pooling** switched on (default).
6. Copy the full connection string shown. It looks like:
   `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

Keep this tab open — you'll paste it in the next step.

---

## Step 3 — Import into Vercel and connect the database

*This is the step that actually ties GitHub, Vercel, and Neon together.*

1. Go to **vercel.com**, signed in with GitHub.
2. Click **Add New...** (top right) → **Project**.
3. Find your forked `care-medical-platform` repo in the list, click **Import**.
4. Before clicking Deploy, expand **Environment Variables** on that same screen.
5. Add one:
   - **Name:** `DATABASE_URL`
   - **Value:** paste the connection string you copied from Neon
6. Click **Deploy**.

That single click does three things automatically, in order: creates every database table, fills them with demo data, and publishes your live site. That's the whole reason this repo was pre-built to run its setup during the build step — nothing left for you to run by hand.

---

## Step 4 — Open your live app

- First deploy takes 1–3 minutes.
- When it says **Congratulations**, click through to your live URL.

---

## Step 5 — Log in and explore

You'll land on a login screen listing every demo account. Click any one to explore that role:

| Try this | As this role |
|---|---|
| Add a hospital, add a staff member | Admin |
| Book an appointment | Patient |
| Confirm an appointment, enter a lab result, raise a claim | Practitioner |
| Approve or deny a claim | Insurance rep |

Watch what happens across roles — approve a claim as Insurance rep, then log back in as Admin and check Financials. That's the same database, updated live.

---

## If something goes wrong

- **Build failed right after deploying** → almost always the connection string. Go to your Vercel project → **Settings** → **Environment Variables**, check `DATABASE_URL` is complete (ends in `?sslmode=require`, no missing characters), then go to **Deployments** → click **⋯** on the latest one → **Redeploy**.
- **Login page says "No demo accounts found yet"** → the seed step may have failed. Open **Deployments** → click the deployment → view the build log, look for errors near "Seeding Care Medical Group demo data."
- **Nothing happens when you click Add / Approve / Save** → give it a second and refresh — free-tier functions have a brief "cold start" the first time they run.
