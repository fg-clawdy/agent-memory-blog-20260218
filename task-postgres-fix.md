# Task: Fix Database Connection
*Project: agent-memory-blog-20260218*  
*Assigned to: Archie → Deb*

## 🚨 CRITICAL BLOCKER
**Database connection not working**
- Database connection failing in production
- Need to configure correct credentials

## Database Credentials (Provided)

**Connection URLs:**
```bash
DATABASE_URL="postgres://bc6f6ed428e9cfd9ed6f308949618bafb43adaffef5233a918d8472d7204f636:sk_ld8WSgKGEUS8dZvqN8Juw@db.prisma.io:5432/postgres?sslmode=require"

POSTGRES_URL="postgres://bc6f6ed428e9cfd9ed6f308949618bafb43adaffef5233a918d8472d7204f636:sk_ld8WSgKGEUS8dZvqN8Juw@db.prisma.io:5432/postgres?sslmode=require"

PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19sZDhXU2dLR0VVUzhkWnZxTjhKdXciLCJhcGlfa2V5IjoiMDFLSFc3WlI2SzBEREIwNlQ0SEg1NjIyMzQiLCJ0ZW5hbnRfaWQiOiJiYzZmNmVkNDI4ZTljZmQ5ZWQ2ZjMwODk0OTYxOGJhZmI0M2FkYWZmZWY1MjMzYTkxOGQ4NDcyZDcyMDRmNjM2IiwiaW50ZXJuYWxfc2VjcmV0IjoiYjI3ZjZmMDUtZGQ0YS00MjM3LWFjYTMtMzJmZWMxZTJkMzQ2In0.-RWnyudcNiH6SYlhY6DZUBatqwV5eV-tDL6Vjsdejnk"
```

## Fix Required

1. **Update Environment Variables**
   - Set `DATABASE_URL` in Vercel Dashboard → Project → Settings → Environment Variables
   - Add to `.env.local` for local testing
   - Also set `POSTGRES_URL` as fallback

2. **Update Drizzle Config**
   - Verify `drizzle.config.ts` uses `DATABASE_URL`
   - Ensure proper SSL handling for Prisma Postgres

3. **Update Database Client**
   - Check `src/lib/db.ts` uses correct connection
   - May need to use `@vercel/postgres` or direct `pg` driver

4. **Test Connection**
   - Run `npx drizzle-kit push` to apply migrations
   - Verify tables exist in database

## Notes
- Using **Prisma Postgres** (db.prisma.io), not Vercel Postgres
- Prisma connection uses different format
- May need to install `pg` or `@prisma/adapter-pg`

## Acceptance Criteria
- [ ] Database connection works in production
- [ ] Drizzle migrations run successfully
- [ ] Blog posts can be created/retrieved from database

## Handoff
After fixing, hand back to Deb to continue UX improvements.
