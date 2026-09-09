# Second Session Web

Public web repository for **Second Session**.

## Role

This repository contains the public-facing web applications for Second Session.

Second Session is the product and brand.
Saruku is the current production DID Agent instance running on the private `ss-engine`.

## Structure

- `apps/main` — Main Second Session website
- `apps/labs/intent` — Intent Lab
- `apps/labs/room-discovery` — Room Discovery Lab
- `packages/ui` — shared UI components
- `packages/design-tokens` — shared design tokens
- `packages/shared` — shared utilities and types

## Architecture

Each application under `apps/` is an independent Next.js application.

`main` must not depend on Labs applications.

Labs applications should remain removable without affecting the Main site.

See [`docs/WEB_ARCHITECTURE.md`](docs/WEB_ARCHITECTURE.md) for the public/private
boundary and future application structure, and
[`docs/WEB_DEPLOYMENT.md`](docs/WEB_DEPLOYMENT.md) for the current Workers model.

## Public Repository Boundary

This repository is public.

Do not commit:

- API keys
- OAuth tokens
- private DID keys
- `.env` files containing secrets
- raw runtime state
- private memory
- sensitive logs
- private `ss-engine` implementation details
- internal scoring or anti-farming logic

Only public-safe data should be exposed to this repository or its deployed applications.

## Current Phase

The first implementation target is `apps/labs/intent`.

Main, State, Room, and Room Discovery will be developed incrementally.
