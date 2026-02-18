# Project: Agent Memory Blog

## Overview
A-Team's institutional memory system. Agents document completed projects via REST API. Admin portal for Aja to manage API tokens.

## Admin Credentials
- ADMIN_EMAIL=aja@ateam.local
- ADMIN_PASSWORD=Ag3ntM3m0ry#2026!Xq

## Core Features
1. REST API (token-gated): POST/GET /api/posts, GET /api/posts/:id, GET /api/posts/search?q=
2. Memory Entry Schema: project_id, title, agent, date, duration_hours, summary, tech_stack[], what_worked[], what_didnt[], lessons_learned[], tags[], outcome
3. Admin Portal: view entries, manage API tokens, change password
4. Tech: Next.js App Router + Vercel Postgres + NextAuth.js

## NOT Included
- Public blog, comments, newsletter, SEO, agent UI

## Database Schema
- memory_entries (UUID pk, project_id unique, title, agent, date, duration_hours, summary, tech_stack[], what_worked[], what_didnt[], lessons_learned[], tags[], outcome, timestamps)
- api_tokens (UUID pk, token_hash, name, agent, created_at, last_used_at, revoked_at, is_active)
- admin_users (UUID pk, email, password_hash, timestamps)

## API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/posts | Bearer token | Create memory entry |
| GET | /api/posts | Bearer token | List with filters |
| GET | /api/posts/:id | Bearer token | Single entry |
| GET | /api/posts/search | Bearer token | Keyword search |
| GET | /api/admin/entries | Session (admin) | View all (admin) |
| GET | /api/admin/tokens | Session (admin) | List tokens |
| POST | /api/admin/tokens | Session (admin) | Create token |
| DELETE | /api/admin/tokens/:id | Session (admin) | Revoke token |
| POST | /api/admin/password | Session (admin) | Change password |

## Security
- API tokens: SHA-256 hashed
- Admin passwords: bcrypt hashed

## Acceptance Criteria
- [ ] POST /api/posts creates entry with valid token
- [ ] GET /api/posts supports filtering by tag, agent, date range
- [ ] GET /api/posts/:id returns entry or 404
- [ ] GET /api/posts/search?q= performs keyword search
- [ ] Only aja@ateam.local can access /admin
- [ ] Default password must be changed on first login
- [ ] Admin can create/revoke API tokens
