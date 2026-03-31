# OF Chatter Salary Tracker — Setup Guide

> **Don't panic if you've never done this before.** This guide walks you through every single step in plain language. If something goes wrong, check the Troubleshooting section at the bottom.

---

## What This App Does

This is a **private website** you run on your own computer (or a server). It lets your OF chatters log their weekly sales and automatically calculates how much they earned — base pay plus commission — in both PHP and USD.

- Each chatter has their own login and only sees their own data
- The first person to register becomes the **Admin** (that's you)
- As Admin you can see everyone's data and manage accounts
- Pay rates, commission tiers, and the PHP/USD exchange rate are all adjustable

---

## Before You Start — What You Need

You'll need to install 3 free programs. Don't worry, each one has a simple installer.

### 1. Node.js (the engine that runs the app)

Node.js is like the engine that makes the app work.

- Go to **https://nodejs.org**
- Download the version that says **"LTS"** (that means Long Term Support — the stable one)
- Run the installer and click Next through everything
- To check it worked, open a terminal and type:
  ```
  node --version
  ```
  You should see something like `v22.0.0`. Any number 20 or higher is fine.

> **How to open a terminal:**
> - **Windows:** Press `Windows key + R`, type `cmd`, press Enter — OR search for "Command Prompt" or "PowerShell"
> - **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter
> - **Linux:** Press `Ctrl + Alt + T`

---

### 2. pnpm (the package manager that installs the app's dependencies)

Think of pnpm as an app store that downloads everything the project needs automatically.

After Node.js is installed, open your terminal and type this exactly:

```
npm install -g pnpm
```

Press Enter and wait for it to finish. Then check it worked:
```
pnpm --version
```
You should see a number like `9.0.0` or higher.

---

### 3. PostgreSQL (the database that stores all the data)

PostgreSQL is the database — it's where all user accounts, salary records, and settings get saved.

- Go to **https://www.postgresql.org/download/**
- Click your operating system (Windows, macOS, or Linux)
- Download and run the installer
- **During installation, it will ask you to set a password for the "postgres" superuser — write this password down, you'll need it shortly**
- Leave the port as **5432** (the default)
- Finish the installation

---

## Step 1 — Get the Project Files

You have two options:

**Option A — Download the archive (easiest)**

If you downloaded the `.tar.gz` file from this guide, extract it:
- **Windows:** You'll need a program like [7-Zip](https://www.7-zip.org/) — right-click the file → 7-Zip → Extract Here
- **Mac/Linux:** Double-click the file and it will extract automatically

Then in your terminal, navigate into the folder:
```
cd of-chatter-salary-tracker
```

**Option B — Clone from GitHub**

If you have Git installed, open your terminal and run:
```
git clone https://github.com/KleonGIT/of-chatter-salary-tracker.git
cd of-chatter-salary-tracker
```

> **How to navigate in the terminal:**
> `cd` means "change directory" — it's how you move into a folder.
> If you extracted the files to your Desktop, you'd type:
> - **Windows:** `cd C:\Users\YourName\Desktop\of-chatter-salary-tracker`
> - **Mac:** `cd ~/Desktop/of-chatter-salary-tracker`

---

## Step 2 — Create the Database

Now you need to create a database for the app to store data in.

### Open the PostgreSQL command line

- **Windows:** Search for **"psql"** or **"SQL Shell (psql)"** in your Start menu and open it
- **Mac:** Open Terminal and type `psql postgres`
- **Linux:** Open Terminal and type `sudo -u postgres psql`

It will ask for the password you set during PostgreSQL installation. Type it and press Enter (you won't see the characters — that's normal).

### Run these commands one at a time

Copy and paste each line below into psql and press Enter after each one.

**Replace `YourChosenPassword` with any password you want** (write it down!):

```sql
CREATE DATABASE salary_tracker;
CREATE USER tracker_user WITH PASSWORD 'YourChosenPassword';
GRANT ALL PRIVILEGES ON DATABASE salary_tracker TO tracker_user;
```

You should see `CREATE DATABASE`, `CREATE ROLE`, and `GRANT` after each line — that means it worked.

Type `\q` and press Enter to exit psql.

---

## Step 3 — Create the Configuration File

The app needs a file called `.env` that tells it your database password and other settings.

### Create the file

Go into your project folder and create a new file called exactly `.env` (just a dot, then "env", no other extension).

- **Windows:** Open Notepad, then File → Save As → navigate to the project folder → in the filename box type `.env` → change "Save as type" to "All Files" → Save
- **Mac/Linux:** Open any text editor and save the file as `.env` in the project folder

### Paste this into the file

Replace `YourChosenPassword` with the password you picked in Step 2:

```
DATABASE_URL=postgresql://tracker_user:YourChosenPassword@localhost:5432/salary_tracker
SESSION_SECRET=change_this_to_any_long_random_text_at_least_32_characters_long
NODE_ENV=development
```

**What these mean:**
- `DATABASE_URL` — tells the app where your database is and how to log into it
- `SESSION_SECRET` — a secret code used to keep logins secure. Replace the placeholder with any long random text (like a sentence with numbers). The longer the better.
- `NODE_ENV` — tells the app it's running in development mode

**Example of a good SESSION_SECRET:**
```
SESSION_SECRET=my-super-secret-key-for-the-salary-tracker-app-2024-kleon-xD
```

Save the file when done.

---

## Step 4 — Install the App's Dependencies

Open your terminal, make sure you're inside the project folder, then run:

```
pnpm install
```

This downloads everything the app needs to run. It might take 1–3 minutes. You'll see a lot of text scrolling — that's normal. Wait until it stops and you see your cursor again.

---

## Step 5 — Set Up the Database Tables

This command creates all the tables inside your database (like setting up empty spreadsheets for the data to go into):

```
cd lib/db && pnpm run push
```

Wait for it to finish. If it asks you a question about constraints, press Enter to accept the default answer (No).

Then go back to the main project folder:
```
cd ../..
```

> **On Windows**, if `&&` doesn't work, run the two commands separately:
> ```
> cd lib\db
> pnpm run push
> cd ..\..
> ```

---

## Step 6 — Start the App

The app has two parts that both need to be running at the same time:
- The **backend** (the part that handles data and logins)
- The **frontend** (the part you see in your browser)

You need **two terminal windows open at once**.

### Terminal Window 1 — Start the Backend

Open a terminal, navigate to your project folder, and run:

```
pnpm --filter @workspace/api-server run dev
```

Wait until you see something like:
```
Server listening  port: 8080
```

That means the backend is running. **Leave this window open.**

### Terminal Window 2 — Start the Frontend

Open a **second** terminal window, navigate to the same project folder, and run:

```
pnpm --filter @workspace/salary-tracker run dev
```

Wait until you see something like:
```
Local:   http://localhost:5173/
```

**Leave this window open too.**

---

## Step 7 — Open the App in Your Browser

Open your web browser (Chrome, Firefox, Edge — any of them) and go to:

```
http://localhost:5173
```

You should see the Chatter Pay Tracker login screen.

---

## Step 8 — Create Your Admin Account

1. On the login screen, click **"Create one"** (below the Sign In button)
2. Type a username (at least 3 characters, e.g. `kleon`)
3. Type a password (at least 6 characters)
4. Type the password again to confirm
5. Click **"Create Account"**

**You're in! And because you were first, you're automatically the Admin.**

---

## Sharing with Your Chatters

Once the app is running on a server (not just your laptop), share the website link with your chatters. They click "Create one" themselves to make their own accounts. Each chatter only sees their own data — they can never see each other's records.

---

## How to Use the App

| What you want to do | How |
|---|---|
| Track a new week | Click **"New Week"** from the home screen |
| Set your pay rates | Click the **⚙ gear icon** in the top-right corner |
| View all chatters' data | Click **"Admin"** (only visible if you're an admin) |
| Log out | Click the **arrow-out icon** in the top-right corner |

**Default pay settings (can be changed per user in Settings):**
- Hourly rate: $2/hr
- Hours per day: 8hrs → $16/day base pay
- Commission tiers: 3% / 4% / 5% based on net sales
- PHP/USD rate: configurable

---

## Stopping and Restarting the App

To **stop** the app, go to each terminal window and press `Ctrl + C`.

To **start it again**, repeat Step 6 (open two terminals and run both commands again).

---

## Troubleshooting

### "I see an error about DATABASE_URL"
Your `.env` file is missing or has a typo. Check:
- The file is named exactly `.env` (not `.env.txt` or `env`)
- It is saved inside the project folder (not inside a subfolder)
- The `YourChosenPassword` in `DATABASE_URL` matches what you set in Step 2

### "I see an error about 'relation users does not exist'"
You skipped or something went wrong in Step 5. Run this again from the project folder:
```
cd lib/db && pnpm run push
cd ../..
```

### "The page loads but shows a blank screen or spins forever"
The backend isn't running. Check Terminal Window 1 — if it stopped or shows an error, run the backend command again.

### "Login says 'Invalid credentials'"
You haven't registered yet. Go back and click "Create one" to make an account first.

### "Port already in use" error
Something else is using that port. The easiest fix:
- **Windows:** Open Task Manager → find `node.exe` → End Task
- **Mac/Linux:** Run `lsof -ti:8080 | xargs kill` or `lsof -ti:5173 | xargs kill`

Then try starting the app again.

### "pnpm: command not found"
pnpm didn't install correctly. Try closing and reopening your terminal, then run `npm install -g pnpm` again.

### "node: command not found"
Node.js isn't installed or didn't get added to your PATH. Re-download and reinstall from https://nodejs.org — make sure to check the box that says "Add to PATH" during installation.

---

## Running It on a Server (So Everyone Can Access It Online)

If you want chatters to access it from their own computers (not just yours), you need to host it on a server. The easiest beginner-friendly options are:

- **Railway** — https://railway.app (free tier available, supports Node.js + PostgreSQL)
- **Render** — https://render.com (free tier available)
- **A VPS** (DigitalOcean, Linode, Vultr) — more control, ~$5/month

For Railway or Render: connect your GitHub repo, add the same environment variables from your `.env` file in the dashboard, and they handle the rest.

---

## Something Still Not Working?

Check that:
1. Both terminal windows are still running (no error messages)
2. Your `.env` file has the correct database password
3. You ran `pnpm install` successfully
4. You ran the database push command in Step 5

Still stuck? Check the error message carefully — it usually tells you exactly what went wrong.
