# Relay

Relay is a self-hosted Discord operations bot for structured communities.

It is built for communities that need reliable onboarding, reminder scheduling, moderation guardrails, and audit trails — not entertainment commands or AI chat features.

Relay treats a Discord server like a small operational system:

- Events come in from Discord
- Server rules and configuration are evaluated
- Actions are executed automatically
- Important state is persisted in PostgreSQL
- Outcomes are logged for staff visibility

---

## Features

### Staff Controls

| Command | Description |
|---------|-------------|
| `/ping` | Health check — confirms bot is responsive and shows latency |
| `/config view` | Display current guild settings |
| `/config set` | Update welcome channel, mod log channel, or welcome message |

### Onboarding Automation

- Sends a configurable welcome message when a member joins
- Supports `{user}`, `{server}`, and `{memberCount}` placeholders
- Logs join events to the mod log channel with account age

### Reminder Operations

| Command | Description |
|---------|-------------|
| `/remind create` | Schedule a one-time reminder (supports `10m`, `2h`, `1d` durations) |
| `/remind list` | List your pending reminders |
| `/remind delete` | Cancel a pending reminder by ID |

Reminders are persisted in PostgreSQL and delivered by a background scheduler that polls every 30 seconds with retry logic (max 3 attempts).

### Moderation Guardrails

| Command | Description |
|---------|-------------|
| `/mod rule add` | Add an auto-moderation rule (banned phrase or regex) |
| `/mod rule list` | List all active rules for the guild |
| `/mod rule remove` | Remove a rule by ID |
| `/mod warn` | Issue a warning to a user (DMs them + logs it) |
| `/mod history` | View moderation history for a user |

Auto-mod actions per rule: **Delete**, **Warn**, or **Mute** (10-minute timeout).

### Observability

- `GET /health` — Server status + Discord gateway check
- `GET /status` — Extended health with database connectivity, returns 503 when unhealthy
- Structured JSON logging via Pino on all operations

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Language | TypeScript (strict mode) |
| Discord SDK | discord.js 14 |
| HTTP Server | Fastify 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Validation | Zod 4 |
| Logging | Pino |
| Testing | Vitest |
| Containerization | Docker + Docker Compose |
| CI | GitHub Actions |

---

## Project Structure

```
relay/
  src/
    app.ts                          # Entry point — wires all services
    bot/
      client.ts                     # Discord.js client factory
      register-commands.ts          # Slash command registration
      commands/
        index.ts                    # Command registry
        ping.ts                     # /ping
        config.ts                   # /config view, /config set
        remind.ts                   # /remind create, list, delete
        mod.ts                      # /mod rule add/list/remove, warn, history
      events/
        ready.ts                    # Bot online handler
        interaction-create.ts       # Slash command router
        relay-member-add.ts         # Welcome message + mod log on join
        message-create.ts           # Auto-moderation (phrase/regex matching)
    controllers/
      config.controller.ts          # Guild settings business logic
      reminders.controller.ts       # Reminder CRUD + delivery
      moderation.controller.ts      # Warn/ban/kick/mute + history
    types/
      config.type.ts                # RelayConfig, UpdateRelayConfigInput
      reminders.type.ts             # ReminderEntry, CreateReminderInput
      moderation.type.ts            # ModerationInput, ModerationResult
    jobs/
      reminders.scheduler.ts        # Background polling loop for due reminders
    routes/
      health.ts                     # HTTP health/status endpoints
    db/
      index.ts                      # Prisma client singleton
    config/
      env.ts                        # Environment validation (Zod)
    utils/
      logger.ts                     # Pino structured logger
      shutdown.ts                   # Graceful shutdown orchestrator
      Error.ts                      # Custom error types
  prisma/
    schema.prisma                   # Database schema
    prisma.config.ts                # Prisma 7 config (migration URL)
  tests/
    health.test.ts                  # Health route tests
    types.test.ts                   # Type shape validation
    commands/
      config.test.ts                # /config command definition tests
      remind.test.ts                # Duration parsing tests
      mod.test.ts                   # /mod command definition tests
  .github/
    workflows/
      ci.yml                        # Lint + typecheck + test
  docker-compose.yml
  Dockerfile
  package.json
  tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 22
- npm >= 10
- PostgreSQL 16 (or use the Docker Compose stack)
- A Discord bot token and client ID

### 1. Clone and install

```bash
git clone <repo-url>
cd relay
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

```env
PORT=3001
LOG_LEVEL=info
DATABASE_URL=postgresql://user:password@localhost:5432/relay
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
DISCORD_GUILD_ID=your-dev-guild-id  # optional, for guild-scoped command registration
```

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npx prisma db push

# Or create a migration (production)
npx prisma migrate dev --name init
```

> **Note:** Prisma 7 reads the DATABASE_URL from `prisma/prisma.config.ts`. If you get URL errors, pass `--url "$DATABASE_URL"` explicitly.

### 4. Start development

```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

### 5. Run with Docker

```bash
docker compose up
```

This starts both the app and a PostgreSQL 16 container.

---

## Development

### Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type verification |
| `npm test` | Run test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:studio` | Open Prisma Studio GUI |

### Running tests

```bash
npm test
```

Tests cover:
- Health route responses
- Command definitions (names, permissions, subcommands)
- Duration parsing logic
- Type interface shapes

---

## Database Schema

### Models

| Model | Purpose |
|-------|---------|
| `Relay` | A registered Discord server |
| `User` | A Discord user who has interacted with the bot |
| `RelaySetting` | Per-guild config (welcome channel, mod log, welcome message) |
| `Reminder` | Scheduled one-time reminders with status tracking |
| `ModerationRule` | Auto-mod rules (banned phrase or regex pattern) |
| `ModerationAction` | Log of moderation actions taken (warn, ban, kick, mute) |

### Enums

| Enum | Values |
|------|--------|
| `ReminderStatus` | PENDING, DELIVERED, CANCELLED, FAILED |
| `RuleType` | BANNED_PHRASE, REGEX |
| `RuleAction` | DELETE, WARN, MUTE |
| `ModerationActionType` | WARN, KICK, BAN, MUTE |

---

## Deployment

### Docker Compose (recommended)

```bash
# Set environment variables
cp .env.example .env
# Edit .env with production values

# Start the stack
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy
```

### VPS Deployment

1. Install Docker and Docker Compose on your VPS
2. Clone the repository
3. Configure `.env` with production credentials
4. Run `docker compose up -d`
5. Verify with `curl http://localhost:3000/health`

### CI Pipeline

GitHub Actions runs on every push to `main` and on pull requests:

1. Install dependencies
2. Generate Prisma client
3. Lint
4. Typecheck
5. Test

---

## Permissions

| Command | Required Permission |
|---------|-------------------|
| `/config` | Manage Guild |
| `/mod` | Moderate Members |
| `/ping` | None |
| `/remind` | None |

---

## Who It Is For

- Tech communities
- Bootcamps
- Study groups
- Hackathon servers
- Founder or builder circles
- Private learning communities

---

## Design Philosophy

Commands exist mainly to configure the system and inspect outcomes. The real product is the automation layer that keeps a community organized with less manual work and clearer accountability.

For the full technical design document, see [RELAY_PROJECT_PLAN.md](RELAY_PROJECT_PLAN.md).
