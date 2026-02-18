# Task: Set up Vercel Postgres and database schema

## Objective
Create PostgreSQL schema for memory_entries, api_tokens, and admin_users tables

## Acceptance Criteria
- Vercel Postgres provisioned (or local postgres for dev)
- Migration file with all three tables
- Indexes on agent, date, tags, project_id
- Seed data for initial admin user

## Tech Stack
- Frontend: Next.js 14 App Router
- Backend: Next.js API Routes  
- Database: Vercel Postgres
- Auth: NextAuth.js

## Dependencies
- story-001: ✅ Complete

## Database Schema

### Table: admin_users
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: api_tokens
```sql
CREATE TABLE api_tokens (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  agent_tag VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);
```

### Table: memory_entries
```sql
CREATE TABLE memory_entries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  agent VARCHAR(100) NOT NULL,
  project_id VARCHAR(100),
  tags TEXT[],
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_memory_agent ON memory_entries(agent);
CREATE INDEX idx_memory_date ON memory_entries(created_at);
CREATE INDEX idx_memory_tags ON memory_entries USING GIN(tags);
CREATE INDEX idx_memory_project ON memory_entries(project_id);
```

## Seed Data
Insert initial admin user:
- email: aja@ateam.local
- password_hash: Use bcrypt hash of "Ag3ntM3m0ry#2026!Xq"

## Package to Install
```bash
npm install @vercel/postgres
# or
npm install pg
```

## Files to Create
1. `src/lib/db.ts` - Database connection
2. `src/lib/schema.sql` - SQL migration file  
3. `src/scripts/seed-admin.ts` - Seed script
4. `.env.local` - Database URL (use dummy for now, real one set in Vercel)

## Commit Format
When done: `git add -A && git commit -m "feat: setup-postgres-schema-and-tables"`

## CRITICAL
- Run seed script to create admin user
- Verify tables exist with psql or drizzle/console
- Do NOT start other tasks — only implement THIS task