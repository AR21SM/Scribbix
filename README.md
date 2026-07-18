# Scribbix

Scribbix is a real-time collaborative whiteboard for drawing, planning, and sharing ideas with a team.

## Screenshots

![Scribbix hero workspace](docs/screenshots/scribbix-hero.png)

![Scribbix dashboard](docs/screenshots/dashboard.png)

![Scribbix canvas editor](docs/screenshots/canvas.png)

## Features

- Real-time multi-user canvas with collaborator presence and cursors
- Freehand drawing, shapes, lines, arrows, text, selection, erasing, zoom, undo, and redo
- Canvas templates for common diagrams and planning workflows
- Persistent canvases, room membership, and chat backed by PostgreSQL
- Email/password authentication with optional Google and GitHub OAuth
- Next.js web app, Express HTTP API, and WebSocket service in one pnpm monorepo

## Stack

- Next.js, React, and Tailwind CSS
- Express and TypeScript
- WebSockets for live collaboration
- PostgreSQL and Prisma
- pnpm workspaces and Turborepo

## Requirements

- Node.js 22.18 or newer
- pnpm 9 or newer
- PostgreSQL, locally or through a hosted provider
- Docker Desktop for the included local PostgreSQL service

## Getting started

Install dependencies:

```bash
corepack enable
pnpm install
```

Create a local environment file from the example and set the required values:

```bash
cp .env.example .env
```

Set a strong `JWT_SECRET` in `.env`. The complete list of environment variables and their defaults is documented in [`.env.example`](.env.example). Google and GitHub OAuth variables are optional.

Start PostgreSQL with Docker:

```bash
docker compose up -d --wait postgres
```

Generate the Prisma client and apply migrations:

```bash
pnpm --filter @repo/db db:generate
pnpm --filter @repo/db db:deploy
```

Start the web app and backend services:

```bash
pnpm dev
```

By default, the services run at:

| Service          | URL                     |
| ---------------- | ----------------------- |
| Web app          | `http://localhost:3002` |
| HTTP API         | `http://localhost:3001` |
| WebSocket server | `ws://localhost:8080`   |

## Deployment

The web app is deployed on Vercel. The HTTP API and WebSocket service run on Railway with PostgreSQL.

For a deployment, configure the variables in [`.env.example`](.env.example) in the platform's environment settings. Set the frontend and public backend URLs to their deployed HTTPS/WSS addresses, and run the database migration command during the backend release:

```bash
pnpm --filter @repo/db db:deploy
```

The API exposes `GET /health` for liveness and `GET /ready` for liveness plus database readiness checks.

## Useful commands

```bash
pnpm dev                                             # Run all services
pnpm build                                           # Build all packages and apps
pnpm typecheck                                       # Type-check the workspace
pnpm lint                                            # Run workspace linting
pnpm --filter scribbix-http-backend test             # Run HTTP backend tests
pnpm --filter @repo/db db:studio                     # Open Prisma Studio
```

## Project structure

```text
apps/
  scribbix-web/       Next.js frontend
  http-backend/       Express API and OAuth routes
  ws-backend/         WebSocket collaboration server
packages/
  db/                 Prisma schema, client, and migrations
  common/             Shared application types
  backend-common/     Shared backend configuration
  ui/                 Shared UI components
```

## Contributing

Issues and pull requests are welcome. Keep changes focused, follow the existing TypeScript conventions, and run the relevant checks before opening a pull request.

## License

Scribbix is licensed under the [Apache License 2.0](LICENSE).
