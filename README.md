# Alien Miniapp Boilerplate

Boilerplate for building miniapps on the Alien platform. Next.js 16, PostgreSQL, Drizzle ORM, JWT auth.

## Quick Start

```bash
bun install
docker compose up -d
bun run db:migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |

## Project Structure

```
app/
├── api/me/route.ts            # Authenticated user endpoint
├── layout.tsx                  # Root layout with AlienProvider
├── page.tsx                    # Home page
├── providers.tsx               # Client-side providers
├── error.tsx                   # Error boundary
└── global-error.tsx            # Global error boundary
features/
├── auth/
│   ├── components/
│   │   └── connection-status.tsx   # Bridge & token status indicator
│   └── lib.ts                      # Token verification (JWKS)
└── user/
    ├── components/
    │   └── user-info.tsx           # User info display
    ├── dto.ts                      # Zod schemas for user data
    ├── hooks/
    │   └── use-current-user.ts     # Hook to fetch current user
    └── queries.ts                  # Database queries (find/create user)
lib/db/
├── index.ts                   # Database connection & migrations
└── schema.ts                  # Drizzle schema
```

## Auth

Authentication is handled automatically by the Alien platform:

1. Alien app injects an auth token when loading your miniapp
2. `useAlien()` hook from `@alien_org/react` provides the token on the client
3. Frontend sends the token as `Authorization: Bearer <token>` to your API routes
4. API verifies the token against Alien's JWKS using `@alien_org/auth-client`
5. The `sub` claim from the JWT is the user's unique Alien ID

**Registration is implicit** — on first API call, the user is automatically created in the database via a find-or-create pattern. No signup flow needed.

When running outside the Alien app, the bridge won't be available. The connection status component helps with debugging.

## Database

PostgreSQL with Drizzle ORM. Local setup uses Docker (`docker-compose.yml`).

**Schema** (`lib/db/schema.ts`):

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Auto-generated primary key |
| `alienId` | TEXT (unique) | User's Alien ID from JWT `sub` claim |
| `createdAt` | TIMESTAMP | Set on first auth |
| `updatedAt` | TIMESTAMP | Updated on each auth |

**Commands:**

```bash
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply pending migrations
bun run db:push       # Push schema directly (dev only)
bun run db:studio     # Open Drizzle Studio GUI
```

To run migrations automatically on server start, set `RUN_MIGRATIONS=true`. Disabled by default.

## API

### `GET /api/me`

Returns the authenticated user. Requires Bearer token.

```json
{
  "id": "uuid",
  "alienId": "user-alien-id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Deployment

1. Set up a PostgreSQL database and set `DATABASE_URL`
2. Either run `bun run db:migrate` manually or set `RUN_MIGRATIONS=true` for auto-migration on start
3. Deploy
