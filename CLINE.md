# Task: Initialize Next.js project with TypeScript

## Objective
Initialize Next.js 14 with App Router, TypeScript, Tailwind CSS, and ESLint

## Acceptance Criteria
- npx create-next-app@latest runs successfully
- TypeScript strict mode enabled
- Tailwind CSS configured and working
- ESLint with recommended rules
- Git repository initialized (already cloned, so just verify working)

## Tech Stack
- Frontend: Next.js 14 App Router
- Backend: Next.js API Routes
- Database: Vercel Postgres
- Auth: NextAuth.js
- Deployment: Vercel

## Current Project State
- Repo already cloned at `/home/ateam/projects/agent-memory-blog-20260218`
- Currently has: prd.json, prd.md, NOW.md
- Need to run `npx create-next-app@latest` to scaffold the app

## Known Pitfalls
- When running create-next-app, use `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` flags
- Do NOT use `--no-git` since repo is already initialized
- Use `--use-npm` to avoid npm vs yarn prompts

## Command to Run
```bash
cd /home/ateam/projects/agent-memory-blog-20260218
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

## Commit Format
When done: `git add -A && git commit -m "feat: initialize nextjs-14-project-with-typescript"`

## CRITICAL
- Run the create-next-app command to scaffold the project
- Verify TypeScript, Tailwind, and ESLint are working by running `npm run build` or checking config files
- Do NOT start other tasks — only implement THIS task