# OF Chatter Salary Tracker — Setup Guide

## What This Is

A private, multi-user weekly salary tracker for OnlyFans chatters.

- **Base pay:** $2/hr × 8 hrs = $16/day (configurable per user)
- **Commission tiers:** Configurable per user
- **Currency:** PHP (₱) primary, USD ($) secondary (exchange rate configurable)
- **Auth:** Standalone username + password — no third-party login needed
- **Admin panel:** First account registered becomes admin automatically

---

## Prerequisites

| Tool | Minimum Version | How to Install |
|------|----------------|----------------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| PostgreSQL | 14+ | https://www.postgresql.org/download/ |

---

## Step 1 — Get the Code

```bash
git clone https://github.com/KleonGIT/of-chatter-salary-tracker.git
cd of-chatter-salary-tracker
```

Or extract from the downloaded archive:
```bash
tar -xzf of-chatter-salary-tracker.tar.gz
cd of-chatter-salary-tracker
```

---

## Step 2 — Create a PostgreSQL Database

Open your PostgreSQL terminal (`psql`) and run:

```sql
CREATE DATABASE salary_tracker;
CREATE USER tracker_user WITH PASSWORD 'choose_a_password';
GRANT ALL PRIVILEGES ON DATABASE salary_tracker TO tracker_user;
```

---

## Step 3 — Set Up Environment Variables

Create a file called `.env` in the **root** of the project folder:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://tracker_user:choose_a_password@localhost:5432/salary_tracker

# Session secret — must be a long random string (32+ characters)
SESSION_SECRET=replace_this_with_a_very_long_random_string_at_least_32_chars

# Node environment
NODE_ENV=development
```

To generate a strong session secret, run:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Step 4 — Install Dependencies

```bash
pnpm install
```

---

## Step 5 — Set Up the Database Tables

```bash
cd lib/db && pnpm run push
cd ../..
```

If it asks about adding constraints to existing data, choose **No, add without truncating**.

---

## Step 6 — Start the App

You need **two terminal windows** running at the same time:

**Terminal 1 — Backend (API server):**
```bash
pnpm --filter @workspace/api-server run dev
```
Runs on port **8080** by default.

**Terminal 2 — Frontend (web app):**
```bash
pnpm --filter @workspace/salary-tracker run dev
```
Runs on port **5173** by default.

Then open your browser and go to: **http://localhost:5173**

---

## Step 7 — Create the First Account (Admin)

1. Open **http://localhost:5173** in your browser
2. Click **"Create one"** under the sign-in form
3. Choose a username and password (username min 3 chars, password min 6 chars)
4. Click **"Create Account"**

> The **first** account registered is automatically the **Admin**.
> Share the link with chatters and have them register their own accounts.
> Each chatter only sees their own data.

---

## How It Works

| Feature | Details |
|---|---|
| Base pay | Hourly rate × hours/day (default: $2 × 8 = $16/day) |
| Commission | Configurable tiers on net sales (default: 3% / 4% / 5%) |
| Currency | PHP (₱) primary, USD ($) secondary (configurable rate) |
| Settings | Each user configures their own rates via the ⚙ gear icon |
| Admin | Can see all chatters' weeks, earnings, and promote/demote admins |

---

## Project Structure

```
of-chatter-salary-tracker/
├── artifacts/
│   ├── api-server/        ← Express.js REST API (auth, weeks, admin)
│   └── salary-tracker/    ← React + Vite frontend
├── lib/
│   ├── db/                ← Drizzle ORM schema (users, sessions, weeks, settings)
│   ├── api-spec/          ← OpenAPI 3.1 spec (source of truth for types)
│   ├── api-client-react/  ← Auto-generated React Query hooks
│   ├── api-zod/           ← Auto-generated Zod validators
│   └── replit-auth-web/   ← Auth hook (login / register / logout)
├── SETUP_GUIDE.md
└── pnpm-workspace.yaml
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `DATABASE_URL not set` | Make sure your `.env` file is in the project root |
| `relation "users" does not exist` | Run `cd lib/db && pnpm run push` |
| Frontend shows blank or loading forever | Make sure the API server is running on port 8080 |
| Login says "Invalid credentials" | You need to register first — click "Create one" |
| Port already in use | Kill the process using that port or change PORT in `.env` |
| Password error on register | Password must be at least 6 characters |

---

## Production Deployment (VPS / Server)

1. Set `NODE_ENV=production` in your environment
2. Build the frontend: `pnpm --filter @workspace/salary-tracker run build`
3. Serve the built `dist/` folder via nginx/caddy as a static site
4. Proxy `/api/*` requests to port 8080 (the API server)
5. Run the API with pm2: `pm2 start "pnpm --filter @workspace/api-server run start" --name api`

Example nginx config snippet:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
}
location / {
    root /path/to/artifacts/salary-tracker/dist;
    try_files $uri $uri/ /index.html;
}
```
