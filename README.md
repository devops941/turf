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

