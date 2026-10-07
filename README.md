# turf

Turf Booking Platform — a multi-role sports turf booking system (3-sided marketplace).

- **Players (USER)** browse venues, book slots, pay, and review.
- **Venue Owners (VENUE_OWNER)** manage venues, slots, bookings, earnings, and their own payment gateway.
- **Admin (ADMIN)** configures the platform payment gateway, commission splits, and monitors payouts.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4
- **Backend:** FastAPI + Prisma
- **Database:** MongoDB

## Key features

- Dynamic payment-gateway configuration (admin-managed provider + credentials)
- Per-venue payment gateways: owners connect their own credentials, players pay into the owner's gateway, and the platform share is split out automatically
- Automatic split payouts between venue owners and the platform
- Webhook-driven payment confirmation, verified per venue

## How payment routing works

Each venue can either use the **platform gateway** or the owner's **own gateway**:

| Player pays into | Venue share | Platform share |
| --- | --- | --- |
| Platform gateway | Transferred out to the owner | Stays with the platform |
| Owner's own gateway | Already held by the owner | Routed from the owner's gateway to the platform account |

The gateway source is recorded on every booking and transaction, so the payout
engine always settles from the account that actually holds the money. Venues
without their own gateway fall back to the platform gateway automatically.

Owners manage this self-serve at `/owner/gateway` (per venue); the admin still
manages the platform-wide gateway at `/admin/gateway`.


## Project structure

```
frontend/   Next.js app (UI)
backend/    FastAPI app (API, Prisma schema, services)
```

## Prerequisites

- **Python 3.11+** (tested on 3.13)
- **Node.js 20.9+** (tested on 24; required by Next.js 16)
- A **MongoDB** database (local `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string)

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # then edit DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY
prisma generate                    # generate the Prisma Python client
python -m app.seed                 # create admin, sample owners, venues, slots
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000` (interactive docs at `/docs`).

Seeded logins: `admin@crm.local / Admin@123`, `owner@turf.local / Owner@123`, `player@turf.local / Player@123`.

## Frontend setup

```bash
cd frontend
npm install
# create .env.local with the API URL:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Frontend runs at `http://localhost:3000`.

For a production build:

```bash
npm run build
npm run start
```

