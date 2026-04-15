# TicktFlow

## Overview

TicktFlow is a full-stack event ticketing and access-control platform built with Next.js (App Router), Clerk authentication, and PostgreSQL via Drizzle ORM. It supports event creation, role-based participation, ticket generation, admin-code access, and QR-based entry validation through API-driven workflows.

## Features

### User Features

- View all active events
- Complete student profile onboarding
- Generate a ticket for an event
- View joined events and ticket status
- Display QR code for event entry

### Admin Features

- Create events with generated admin code
- Join an event as admin via admin code
- Access manager dashboard for each event
- View total tickets, scanned tickets, and member roles
- Scan and validate QR tickets at entry

## Authentication

Authentication and session management are handled by Clerk.

- Client authentication state via `useUser()`
- Route-level authorization checks in API handlers via `auth()`
- Sign-in and sign-up routes:
  - `/sign-in/[[...rest]]`
  - `/sign-up/[[...sign-up]]`
- Authorization model:
  - Event roles (`creator`, `admin`, `member`) stored in `event_members`
  - Role checks enforced in manager and scan APIs

## System Architecture

```text
[Browser UI]
    |
    v
[Next.js App Router Pages]
    |
    v
[API Routes (/api/*)]
    |
    v
[Drizzle ORM + Raw SQL]
    |
    v
[PostgreSQL (Render)]
```

## Project Structure

```text
.
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── events
│   │   │   │   ├── [eventId]/manager/route.ts
│   │   │   │   ├── join/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── ticket
│   │   │   │   ├── scan/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── ticket_desc/route.ts
│   │   │   ├── sync-user/route.ts
│   │   │   ├── get_student_id/route.ts
│   │   │   └── student_details/route.ts
│   │   ├── events
│   │   │   ├── [eventId]/manager/page.tsx
│   │   │   ├── me/page.tsx
│   │   │   └── page.tsx
│   │   ├── sign-in/[[...rest]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── AppHeader.tsx
│   │   ├── QrCode.tsx
│   │   ├── scanner.tsx
│   │   └── ui/background-beams.tsx
│   ├── db
│   │   └── schema.ts
│   └── lib
│       ├── db.ts
│       ├── safeFetch.ts
│       └── utils.ts
├── drizzle.config.ts
├── package.json
└── .env.example
```

## Key Concepts

### Role-Based Access

- Event membership and privileges are stored in `event_members`
- `creator` and `admin` can access management and ticket scanning
- `member` can join and hold a valid event ticket
- Unauthorized and forbidden access are handled with 401/403 API responses

### Idempotent APIs

- Join/admin membership upsert uses conflict-aware SQL
- Ticket creation logic is conflict-safe and returns existing ticket when present
- API response format is standardized as:
  - `{ success: boolean, data?: any, error?: string }`

### QR System

- Ticket ID is encoded as QR payload
- Scanner reads QR and calls `/api/ticket/scan`
- Ticket validation updates:
  - `isvalid = false`
  - `scanned_by`
  - `scanned_at`
- Prevents reuse of already-scanned tickets

## Tech Stack

- Frontend: Next.js 15 (App Router), React 19, TypeScript
- Styling: Tailwind CSS
- Authentication: Clerk
- Database: PostgreSQL (Render)
- ORM/SQL Access: Drizzle ORM with raw SQL execution
- QR: `qrcode.react`, `qr-scanner`
- Tooling: ESLint, Drizzle Kit

## Setup Instructions

### 1) Clone

```bash
git clone <your-repository-url>
cd <your-repository-folder>
```

### 2) Install

```bash
npm install
```

### 3) Environment Variables

Create `.env` (or `.env.local`) using `.env.example`:

```env
DATABASE_URL=
MIGRATION_ACTOR_ID=
CONFIRM_MIGRATION=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_AFTER_SIGN_IN_URL=/
CLERK_AFTER_SIGN_UP_URL=/
```

### 4) Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### 5) Optional: Push Schema

This project uses Drizzle schema push (not migration files):

```bash
npx drizzle-kit push
```

## Deployment

Target environment: Render with PostgreSQL.

- Ensure `DATABASE_URL` and Clerk keys are configured in Render environment variables
- Build command:

```bash
npm run build
```

- Start command:

```bash
npm run start
```

- The app start script binds to Render port via `next start -p $PORT`
- Ensure database network access and SSL-compatible connection string

## Challenges Faced

- Drizzle `db.execute()` result shape inconsistency (`array` vs `.rows`) caused runtime failures
- Missing database constraints caused `ON CONFLICT` failures at runtime
- Intermittent frontend JSON parse failures when API returned HTML error pages
- Duplicate frontend fetches increased perceived latency
- Schema push conflicts required targeted SQL constraint/index fixes

## Future Improvements

- Multi-event tenancy hardening and event-scoped analytics
- Dedicated migration workflow with consistent schema versioning
- Server-side pagination/filtering for events and members
- Observability: request tracing, slow-query logging, API metrics dashboard
- Background jobs for ticket lifecycle and audit reporting
- Automated integration tests for API role/permission matrix

## Demo Flow

1. User signs in with Clerk.
2. Home page syncs user and checks/creates student profile.
3. User navigates to `/events` and views active events.
4. User generates a ticket for an event.
5. Ticket appears in `/events/me` with QR code.
6. Creator/admin opens manager dashboard for the event.
7. Admin scans QR; API validates and marks ticket as used.

## Project Summary

TicktFlow demonstrates a production-style event ticketing workflow with strict API contracts, role-based authorization, and QR-based verification. It combines client-side UX safeguards with backend idempotency and relational data integrity to support reliable event operations.
