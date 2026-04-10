# Relay

Relay is a self-hosted Discord operations bot for structured communities.

It is built for communities that need reliable onboarding, reminder scheduling, moderation guardrails, and audit trails, not entertainment commands or AI chat features.

Relay treats a Discord server like a small operational system:

- events come in from Discord
- server rules and configuration are evaluated
- actions are executed automatically
- important state is persisted in PostgreSQL
- outcomes are logged for staff visibility

That makes Relay a backend product disguised as a bot.

## Who It Is For

Relay is designed for communities that have real operational needs:

- tech communities
- bootcamps
- study groups
- hackathon servers
- founder or builder circles
- private learning communities

It is not meant to be a meme bot, music bot, AI assistant, or generic "do everything" Discord toolkit.

## Core Product Promise

Relay should help a community do four things well:

- onboard every new member properly
- never miss important reminders
- enforce simple moderation rules automatically
- keep staff actions and automation outcomes traceable

## V1 Focus

The first version is intentionally narrow and operational:

- onboarding automation through configurable welcome flows
- one-time reminders backed by persistent state and a scheduler
- moderation guardrails for banned phrases and staff warnings
- structured logs, health checks, and graceful shutdown

## Why This Project Matters

Most Discord bots are built around commands and novelty. Relay is different.

Commands exist mainly to configure the system and inspect outcomes. The real product is the automation layer that keeps a community organized with less manual work and clearer accountability.
