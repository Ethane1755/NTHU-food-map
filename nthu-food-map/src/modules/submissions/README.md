# Submissions Module

Scope:
- User flow for reporting unlisted stores.
- Submission persistence via local backend.

Entry points:
- `index.ts`

Owned files:
- `src/modules/submissions/components/SubmitStoreModal.tsx`
- `src/modules/submissions/components/AddStoreModal.tsx`
- `src/app/api/store-submissions/route.ts`

API contracts:
- Writes with `POST /api/store-submissions`
- Reads with `GET /api/store-submissions`
