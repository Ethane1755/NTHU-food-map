# Shared Module

Scope:
- Cross-module utilities, shared UI shell, and common types.

Entry points:
- `index.ts`

Owned files:
- `src/modules/shared/components/Navbar.tsx`
- `src/modules/shared/lib/utils.ts`
- `src/modules/shared/lib/local-db.ts`
- `src/modules/shared/types/index.ts`

Rules:
- Keep this module dependency-light.
- Do not place domain-specific business logic here.
