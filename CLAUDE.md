# CLAUDE.md

## Project Overview

Alien Miniapp Boilerplate — a production-ready starter for building mini apps on the Alien platform. Ships with authentication and payments. Designed to deploy on **Vercel** with a few clicks.

Docs: https://docs.alien.org/

## Package Manager

**Always use `bun`** as the package manager. Never use npm, yarn, or pnpm.

```bash
bun install        # install dependencies
bun run dev        # start dev server
bun run build      # production build
bun run lint       # run eslint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 (no config file — theme defined inline in `globals.css`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod 4
- **Data Fetching**: TanStack React Query 5
- **Auth**: `@alien_org/auth-client` (server), `@alien_org/react` (client)
- **Deployment**: Vercel

## Project Structure

Feature-based architecture under `features/`. Each feature may contain:

```
features/<name>/
├── components/     # React components (.tsx)
├── hooks/          # Custom hooks (use-*.ts)
├── dto.ts          # Zod schemas & inferred types
├── queries.ts      # Database queries
├── constants.ts    # Feature constants
└── lib.ts          # Utility functions
```

App routes live in `app/`, API routes in `app/api/`, shared utilities in `lib/`.

## Code Conventions

### Formatting
- **Semicolons**: yes
- **Quotes**: double quotes
- **Indentation**: 2 spaces
- **Trailing commas**: yes (multiline)

### Naming
- **Files**: `kebab-case.ts` / `kebab-case.tsx`
- **Components**: `PascalCase` (exported as named functions)
- **Hooks**: `camelCase` with `use` prefix, file name `use-*.ts`
- **Types**: `PascalCase` (prefer `type` over `interface`)
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Functions**: `camelCase`
- **DB columns**: `snake_case` in Postgres, `camelCase` in TypeScript

### Imports
- Always use `@/` path alias (maps to project root) for cross-feature imports
- Relative imports only within the same feature
- Order: external framework → external libs → `@/` internal → relative
- Use `import type` for type-only imports

### TypeScript
- Strict mode enabled
- Explicit return types on exported functions
- Type inference for local variables
- Co-locate Zod schema and inferred type: `export type Foo = z.infer<typeof Foo>;`

### React
- `"use client"` directive on all client components
- Named exports for components: `export function MyComponent()`
- `<>` fragment shorthand
- Tailwind classes directly on elements

## Alien SDK Rules

Follow the official docs at https://docs.alien.org/. Key rules:

### Provider Setup
- Wrap app root with `AlienProvider` (already done in `app/providers.tsx`)
- `AlienProvider` auto-initializes bridge and sends `app:ready`

### Authentication (https://docs.alien.org/react-sdk/auth)
- `useAlien()` provides `authToken` and `isBridgeAvailable`
- Send token as `Authorization: Bearer <token>` to API routes
- **Server-side only**: verify tokens with `@alien_org/auth-client` against JWKS
- `sub` claim = user's Alien ID (wallet address)
- **Never log full tokens in production**
- **Always check `exp` claim** (token expiration)
- Handle `JwtErrors.JWTExpired` and `JwtErrors.JOSEError` in API routes

### Payments (https://docs.alien.org/react-sdk/payments)
- `usePayment()` hook for payment flow
- `pay()` params: `recipient`, `amount` (smallest unit), `token`, `network`, `invoice`
- Supported tokens: `SOL`, `USDC`, `ALIEN`, or any contract address
- Networks: `solana`, `alien`
- Always create an invoice (payment intent) server-side before calling `pay()`
- Webhook must be registered in Dev Portal before accepting payments
- Verify webhook signatures (Ed25519 via `x-webhook-signature` header)
- Webhook statuses: `finalized` (success) → fulfill order, `failed` → reverse if needed
- Ensure idempotency: skip processing if payment intent is already completed/failed
- Test mode: pass `test` scenario to `pay()` — no real funds, webhook still fires with `test: true`
- `PaymentTestScenario` type: `'paid' | 'paid:failed' | 'cancelled' | 'error:insufficient_balance' | 'error:network_error' | 'error:pre_checkout_rejected' | 'error:pre_checkout_timeout' | 'error:unknown'`

### Bridge (https://docs.alien.org/react-sdk/bridge)
- `isBridgeAvailable` is `false` when running outside the Alien app
- Check `supported` property on hooks before calling host methods
- Handle `BridgeTimeoutError`, `BridgeUnavailableError`, `BridgeError`
- Use `mockLaunchParamsForDev()` during local development if needed
- Available events: `miniapp:close`, `host.back.button:clicked`

### Testing (https://docs.alien.org/quickstart/testing)
- Bridge is unavailable in browser dev mode — SDK logs warnings, doesn't crash
- Deploy to a public URL and use the Dev Portal deeplink to test in Alien app
- Remote debugging: Safari Web Inspector (iOS), chrome://inspect (Android)

## API Route Pattern

All protected routes follow this structure:

```typescript
import { NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/features/auth/lib";
import { JwtErrors } from "@alien_org/auth-client";

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request.headers.get("Authorization"));
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }
    const { sub } = await verifyToken(token);
    // ... business logic using sub as the user's Alien ID
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    if (error instanceof JwtErrors.JOSEError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Response format: `{ data }` on success, `{ error: "message" }` on failure.
Validate request bodies with Zod `.safeParse()`.

## Database

- Schema in `lib/db/schema.ts`, connection in `lib/db/index.ts`
- Migrations in `drizzle/`, config in `drizzle.config.ts`
- Tables: `users`, `payment_intents`, `transactions`
- UUID primary keys with `defaultRandom()`
- Timestamps with timezone: `timestamp("col", { withTimezone: true }).defaultNow()`
- Use Drizzle query builder, not raw SQL

```bash
bun run db:generate   # generate migration from schema changes
bun run db:migrate    # apply pending migrations
bun run db:push       # push schema directly (dev only)
bun run db:studio     # open Drizzle Studio GUI
```

## Environment Variables

Validated with Zod in `lib/env.ts`. Use `getServerEnv()` and `getClientEnv()` helpers.

| Variable | Side | Description |
|---|---|---|
| `DATABASE_URL` | Server | PostgreSQL connection string |
| `WEBHOOK_PUBLIC_KEY` | Server | Ed25519 public key for webhook verification |
| `NEXT_PUBLIC_RECIPIENT_ADDRESS` | Client | Solana wallet for USDC/SOL payments |
| `NEXT_PUBLIC_ALIEN_RECIPIENT_ADDRESS` | Client | Alien provider address for ALIEN payments |

## Deployment (Vercel)

This app is designed to run on Vercel. Import the repo, add env vars, deploy — that's it.

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add a PostgreSQL database (Vercel Postgres or external)
4. Set all environment variables
5. Deploy

Vercel auto-detects Next.js and configures the build. For auto-migrations on start, set `RUN_MIGRATIONS=true`.
