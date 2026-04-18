# Workspace

## Overview

Full-stack Student Skill Exchange Platform for college students to trade skills, find complementary matches, send connection requests, open Google Meet study sessions, and chat with accepted connections.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (`artifacts/student-skill-exchange`)
- **API framework**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval from the OpenAPI spec
- **Build**: esbuild for the API server

## App Features

- Student signup, login, logout with secure password hashing and signed HTTP-only sessions
- Profile management: name, college, branch, optional profile picture
- Offered and wanted skill management with categories
- Discover page shows every registered student except the current user, and search matches names, emails, colleges, branches, and skills
- Complementary matching where users teach each other's wanted skills
- Connection requests with pending/accepted/rejected states
- Two-way text messaging between accepted connections with clickable Google Meet links
- Study Meet section can copy or send a Google Meet invite into chat
- Demo classmates auto-accept requests and send persisted replies so new users can test back-and-forth chat immediately
- Dashboard summaries and recent activity

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes in development
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/student-skill-exchange run dev` — run the web app locally

## Demo Data

The API seeds sample students on first request if the database is empty. Demo login:

- Email: `aarav@example.edu`
- Password: `student123`

See `APP_BUILD_GUIDE.md` for a user-facing explanation of how the app was built and how it works.
