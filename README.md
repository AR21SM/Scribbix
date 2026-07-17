# Scribbix

Scribbix is a pnpm/Turborepo application with a Next.js frontend, an Express API, a WebSocket server, and PostgreSQL through Prisma.

## Requirements

- Node.js 22.18 or newer
- Corepack
- PostgreSQL, either locally or from a hosted provider
- Docker Desktop only if you use the included local PostgreSQL service

No external authentication provider is required for email/password login. Google and GitHub login are optional; Scribbix keeps issuing its own signed JWT after either provider verifies the user.

## Local setup

1. Install dependencies with the repository-pinned pnpm version:

   ```powershell
   corepack pnpm install
   ```

2. Create the local environment file:

   ```powershell
   Copy-Item .env.example .env
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Replace `JWT_SECRET=change-me` in `.env` with the generated value. Do not commit `.env`.

3. Start PostgreSQL. For the included local database:

   ```powershell
   docker compose up -d --wait postgres
   ```

   For hosted PostgreSQL, replace `DATABASE_URL` in `.env` with the provider's PostgreSQL connection string. Prisma does not use a Supabase anon key, service-role key, Clerk key, or Auth0 key.

4. Generate Prisma Client and apply migrations:

   ```powershell
   corepack pnpm --filter @repo/db db:generate
   corepack pnpm --filter @repo/db db:deploy
   ```

   The database scripts load `DATABASE_URL` from the root `.env` automatically.

5. Start the application:

   ```powershell
   corepack pnpm dev
   ```

   This starts the frontend, HTTP API, and WebSocket server together with the repository-pinned pnpm version.
   During local development, values in the root `.env` take precedence over stale user-level environment variables. In production, deployment environment variables keep precedence.

The frontend runs at `http://localhost:3002`, the HTTP API at `http://localhost:3001`, and WebSockets at `ws://localhost:8080`. Scribbix uses port `3002` because port `3000` is already used by the MyTube project in this workspace.

## Environment variables

| Variable                   | Required | Purpose                                                     |
| -------------------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`             | Yes      | PostgreSQL connection string used by Prisma                 |
| `JWT_SECRET`               | Yes      | Random secret of at least 32 bytes used to sign auth tokens |
| `FRONTEND_URL`             | No       | Allowed browser origin; defaults to `http://localhost:3002` |
| `HTTP_PORT`                | No       | HTTP API port; defaults to `3001`                           |
| `PUBLIC_HTTP_URL`          | No       | Public HTTP API URL used for OAuth callbacks                |
| `PORT`                     | No       | Deployment-platform fallback for the HTTP API port          |
| `WS_PORT`                  | No       | WebSocket port; defaults to `8080`                          |
| `NEXT_PUBLIC_HTTP_BACKEND` | No       | Browser HTTP API URL; defaults to `http://localhost:3001`   |
| `NEXT_PUBLIC_WS_URL`       | No       | Browser WebSocket URL; defaults to `ws://localhost:8080`    |
| `GOOGLE_CLIENT_ID`         | OAuth    | Google web application client ID                            |
| `GOOGLE_CLIENT_SECRET`     | OAuth    | Google web application client secret                        |
| `GITHUB_CLIENT_ID`         | OAuth    | GitHub OAuth app client ID                                  |
| `GITHUB_CLIENT_SECRET`     | OAuth    | GitHub OAuth app client secret                              |

When changing a port, update its matching browser URL too: `HTTP_PORT` with `NEXT_PUBLIC_HTTP_BACKEND`, `WS_PORT` with `NEXT_PUBLIC_WS_URL`, and the frontend port with `FRONTEND_URL`.

`GET /health` is the API liveness check. `GET /ready` also checks PostgreSQL connectivity and returns `503` when the database is unavailable.

## Google and GitHub login setup

The social buttons can be committed safely, but the provider secrets belong only in `.env` locally and in your deployment secret manager in production.

### Google

1. In Google Cloud Console, configure the OAuth consent screen.
2. Create an OAuth client with application type **Web application**.
3. Add this exact authorized redirect URI for local development:

   ```text
   http://localhost:3001/api/oauth/google/callback
   ```

4. Copy the generated values into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.

### GitHub

1. In GitHub, open **Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Set the homepage URL to `http://localhost:3002`.
3. Set the authorization callback URL to:

   ```text
   http://localhost:3001/api/oauth/github/callback
   ```

4. Copy the generated values into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`.

After pulling the OAuth schema change, apply it and regenerate Prisma Client:

```powershell
corepack pnpm --filter @repo/db db:deploy
corepack pnpm --filter @repo/db db:generate
```

For production, set `FRONTEND_URL`, `PUBLIC_HTTP_URL`, and the two browser URLs to their HTTPS addresses, then register the matching HTTPS callback URLs with both providers.
