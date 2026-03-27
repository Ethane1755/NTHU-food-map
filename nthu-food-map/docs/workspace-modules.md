# Workspace Module Guide

## Goal
Split this workspace into independently maintainable modules with clear ownership, boundaries, and API contracts.

## Module Map
- `map`: map rendering and random picker interactions.
- `stores`: store data loading, list views, store detail cards, promotions display.
- `submissions`: submit unlisted store flow and related backend endpoints.
- `spending`: spending records and analysis UI.
- `auth`: authentication UI/hook contract (local mode).
- `shared`: shared navbar, utilities, and common types.

## Directory Layout
- `src/modules/map`
- `src/modules/stores`
- `src/modules/submissions`
- `src/modules/spending`
- `src/modules/auth`
- `src/modules/shared`
- `src/modules/index.ts` (workspace module exports)

## Backend Split (Local)
- `GET /api/stores` serves store list.
- `GET /api/promotions` serves promotions (supports optional `store_id`).
- `GET /api/store-submissions` serves submissions.
- `POST /api/store-submissions` creates submissions.
- Persistence file: `data/local-db.json` via `src/modules/shared/lib/local-db.ts`.
- Store seed source: latest `data/dataset_crawler-google-places_*.json` during local DB init/migration.

## Ownership Matrix
- map team: `MapClient`, `RandomPicker`
- stores team: `useStores`, store list page, cards, promotions views
- submissions team: submission modal and submission APIs
- spending team: spending page and analysis logic
- auth team: auth button, auth hook, callback route
- platform/shared team: navbar, shared utils, shared types, local DB base utilities

## Dependency Rules
- Feature modules may depend on `shared`.
- Feature modules should avoid importing each other directly when possible.
- Cross-module usage should prefer module exports from `src/modules/*`.
- API routes should depend on `src/modules/shared/lib/local-db.ts` for persistence access.

## Team Workflow Recommendation
1. Each team only edits files in its module folder and owned files listed in module README.
2. Shared contract changes must be reflected in `shared` module first.
3. Any API contract change must update this doc and the module README.
4. Before merge, run lint and basic manual flow checks.

## Migration Status
1. Domain files are physically moved under `src/modules/<name>/`.
2. Core pages import module entry points (`@/modules/...`).
3. Local backend APIs use the shared module datastore utility.
4. Legacy source paths are no longer referenced in TypeScript imports.
