# turf

Turf Booking Platform — a multi-role sports turf booking system (3-sided marketplace).

- **Players (USER)** browse venues, book slots, pay, and review.
- **Venue Owners (VENUE_OWNER)** manage venues, slots, bookings, and earnings.
- **Admin (ADMIN)** configures payment gateways, commission splits, and monitors payouts.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- **Backend:** FastAPI + Prisma
- **Database:** MongoDB

## Key features

- Dynamic payment-gateway configuration (admin-managed provider + credentials)
- Automatic split payouts between venue owners and the platform
- Webhook-driven payment confirmation

## Project structure

```
frontend/   Next.js app (UI)
backend/    FastAPI app (API, Prisma schema, services)
```

## Backend setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
prisma generate
uvicorn app.main:app --reload --port 8000
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```
