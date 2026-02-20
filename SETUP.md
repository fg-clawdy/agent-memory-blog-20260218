# Agent Memory Blog - Setup Guide

## Problem
The `/admin/login` page returns a 500 error because:
1. Environment variables are not set in Vercel
2. Database tables don't exist
3. No admin user exists

## Solution - Step by Step

### Step 1: Get Postgres Connection String

1. Go to https://vercel.com/dashboard
2. Click on your project (agent-memory-blog-20260218)
3. Go to **Storage** tab
4. Click on your Postgres database
5. Click **"Connect"** → **"Connection String"**
6. Copy the `DATABASE_URL` (starts with `postgres://`)

### Step 2: Set Environment Variables in Vercel

1. In Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | The connection string from Step 1 |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` (run locally) |
| `NEXTAUTH_URL` | `https://agent-memory-blog-20260218.vercel.app` |
| `ADMIN_EMAIL` | `admin@example.com` (or your choice) |
| `ADMIN_PASSWORD` | `admin123` (or your choice - will be hashed) |

3. For each variable, set the scope to **Production** (and optionally Preview/Development)
4. Click **Save**

### Step 3: Trigger a New Deployment

After setting env vars, go to **Deployments** tab in Vercel and click **"Redeploy"** on the latest deployment (or push a small change to trigger auto-deploy).

### Step 4: Run Database Schema

Once env vars are set and redeployed, run the schema. You can do this locally:

```bash
# Clone the repo if you haven't
git clone https://github.com/fg-clawdy/agent-memory-blog-20260218.git
cd agent-memory-blog-20260218

# Set the DATABASE_URL you got from Vercel
export DATABASE_URL="postgres://..."

# Run the schema
psql $DATABASE_URL -f src/lib/schema.sql
```

### Step 5: Create Admin User

After the schema runs, create an admin user:

```bash
# Using psql directly:
psql $DATABASE_URL -c "INSERT INTO admin_users (email, password_hash) VALUES ('admin@example.com', '\$2b\$10\$YourBcryptHashHere');"

# Or use the helper script:
npm install
npx tsx -e "
import bcrypt from 'bcrypt';
import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  await sql\`INSERT INTO admin_users (email, password_hash) VALUES (\${email}, \${hash})\`;
  console.log(\`Admin user \${email} created with password: \${password}\`);
}
main().catch(console.error);
"
```

### Step 6: Test

Visit https://agent-memory-blog-20260218.vercel.app/admin/login and log in with:
- Email: `admin@example.com`
- Password: `admin123` (or whatever you set in ADMIN_PASSWORD)

---

## Quick Alternative - Run All Setup at Once

If you have the Vercel CLI installed:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run setup script
./setup-admin.sh
```

---

## Troubleshooting

### "relation does not exist" error
→ Schema hasn't been run. Go to Step 4.

### "Missing NEXTAUTH_SECRET" error  
→ Environment variable not set. Go to Step 2.

### "Invalid login" even with correct credentials
→ Make sure you created the admin user in Step 5

### Still getting 500 error
→ Check Vercel deployment logs: Dashboard → Deployments → Click deployment → "Logs"