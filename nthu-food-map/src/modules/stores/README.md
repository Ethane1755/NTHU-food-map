# Stores Module

Scope:
- Store listing, card rendering, and store data fetching.
- Promotion rendering tied to stores.

Entry points:
- `index.ts`

Owned files:
- `src/modules/stores/hooks/useStores.ts`
- `src/modules/stores/components/StoreCard.tsx`
- `src/modules/stores/components/PromotionsBanner.tsx`
- `src/modules/stores/components/PromotionBanner.tsx`
- `src/app/stores/page.tsx`

API contracts:
- Reads from `GET /api/stores`
- Reads from `GET /api/promotions`
