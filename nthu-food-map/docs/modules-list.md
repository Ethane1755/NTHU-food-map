# Modules List

This document records the current workspace module split.

## 1. map
- Path: `src/modules/map`
- Entry: `src/modules/map/index.ts`
- Responsibilities:
  - Map rendering
  - Marker interactions
  - Random picker flow
- Main files:
  - `src/modules/map/components/MapClient.tsx`
  - `src/modules/map/components/RandomPicker.tsx`

## 2. stores
- Path: `src/modules/stores`
- Entry: `src/modules/stores/index.ts`
- Responsibilities:
  - Store data fetching
  - Store cards and listing
  - Store promotions rendering
- Main files:
  - `src/modules/stores/hooks/useStores.ts`
  - `src/modules/stores/components/StoreCard.tsx`
  - `src/modules/stores/components/PromotionsBanner.tsx`
  - `src/modules/stores/components/PromotionBanner.tsx`

## 3. submissions
- Path: `src/modules/submissions`
- Entry: `src/modules/submissions/index.ts`
- Responsibilities:
  - Submit unlisted store UI
  - Store submission backend contract
- Main files:
  - `src/modules/submissions/components/SubmitStoreModal.tsx`
  - `src/modules/submissions/components/AddStoreModal.tsx`
  - `src/app/api/store-submissions/route.ts`

## 4. spending
- Path: `src/modules/spending`
- Entry: `src/modules/spending/index.ts`
- Responsibilities:
  - Spending record UI
  - Spending analysis and summaries
- Main files:
  - `src/app/spending/page.tsx`

## 5. auth
- Path: `src/modules/auth`
- Entry: `src/modules/auth/index.ts`
- Responsibilities:
  - Auth UI contract (local mode)
  - Auth hook contract and callback route
- Main files:
  - `src/modules/auth/components/AuthButton.tsx`
  - `src/modules/auth/hooks/useAuth.ts`
  - `src/app/auth/callback/route.ts`

## 6. shared
- Path: `src/modules/shared`
- Entry: `src/modules/shared/index.ts`
- Responsibilities:
  - Shared UI shell
  - Common utils and shared types
- Main files:
  - `src/modules/shared/components/Navbar.tsx`
  - `src/modules/shared/lib/utils.ts`
  - `src/modules/shared/lib/local-db.ts`
  - `src/modules/shared/types/index.ts`

## Module Usage Rule
- Prefer importing from module entries (`@/modules/<module>`) in pages and cross-feature code.
- Keep domain logic inside its owning module; only shared primitives should live in `shared`.
