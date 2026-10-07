# AGENTS.md

Repository notes for AI agents working on TurfHub.

## Layout

Only two application folders: `frontend/` (Next.js) and `backend/` (FastAPI + Prisma/MongoDB).

## Local run

```bash
# backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 8000
# frontend
cd frontend && npm run build && npm run start   # http://localhost:3000
```

Frontend reads `NEXT_PUBLIC_API_URL` (`.env.local`, defaults to `http://localhost:8000`).

## Prisma on this host (important)

`prisma py fetch` only downloads the `debian-openssl-3.0.x` engine, but this host
reports OpenSSL 3.5, so Prisma Python looks for
`prisma-query-engine-debian-openssl-3.5.x`. Symptom on startup:

```
prisma.engine.errors.BinaryNotFoundError: Expected ... openssl-3.5.x ...
```

Fix (one-time per sandbox): download the matching binary and point Prisma at it.

```bash
C=393aa359c9ad4a4bb28630fb5613f9c281cde053
curl -s -o /tmp/qe.gz "https://binaries.prisma.sh/all_commits/$C/debian-openssl-3.0.x/query-engine.gz"
gunzip -f /tmp/qe.gz && chmod +x /tmp/qe
cp /tmp/qe backend/prisma-query-engine-debian-openssl-3.5.x
# backend/.env
PRISMA_QUERY_ENGINE_BINARY=./prisma-query-engine-debian-openssl-3.5.x
```

The binary is git-ignored (`prisma-query-engine-*`). Prefer this over `prisma py generate`
or `prisma py fetch` alone.

## Design system

- Global tokens live in `frontend/app/globals.css` under `@theme` (Tailwind v4).
- The landing page (`frontend/app/page.tsx`) uses an additional "Night Match
  Editorial" poster system: `.text-poster` (Anton), `.eyebrow` (Space Mono),
  `.grain`, `.reveal`, plus `ink`/`volt`/`flame` color tokens and `.animate-ticker`
  / `.animate-sweep`. These are page-scoped by class; dashboard/admin pages keep
  the original slate/brand look.
- Scroll reveal uses `frontend/components/RevealOnScroll.tsx` (IntersectionObserver
  adding `.is-in` to `.reveal` elements).

## Backend notes

- Per-venue payment gateways: `app/services/venue_gateway.py`, split routing in
  `app/services/payouts.py` + `app/services/gateway.py`.
- Re-run seed with `python -m app.seed` (idempotent).
