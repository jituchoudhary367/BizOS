# BizOS — AI Operating System for Small Businesses

> **"Run your business in plain language."**

# BizOS — Business Operations Platform

Overview
--------
BizOS is a modular business-operations platform designed as a lightweight microservice monorepo for small-to-medium businesses. It includes a Postgres-backed Supabase schema (with RLS and realtime), Node.js microservices, a React/Vite frontend, background workers (BullMQ), Supabase Edge Functions, and an AI service for domain intelligence.

This README documents every major feature, how the pieces fit together, detailed local development and production deployment steps, environment variables, database migration and realtime wiring, service APIs, and troubleshooting guidance.

Key features
------------
- Multi-tenant data model (per-business `businesses`, `profiles`) with Row-Level Security policies.
- Realtime UI updates via Supabase Realtime publications and the frontend `useRealtimeTable` hook.
- Orders & Inventory domain: order creation, reservation (RPC `decrement_stock`), stock adjustments.
- WhatsApp pipeline: incoming webhook handling, message persistence (`whatsapp_messages`), conversation view, reply/convert-to-order flows.
- Notifications service: internal notifications, email queue placeholder, WhatsApp proxy.
- Background worker queue (BullMQ) for async jobs (requires `REDIS_URL`).
- AI service (FastAPI/Python) for forecasting, parsing messages, and agent integrations.
- Supabase Edge Functions for serverless hooks and integrations (Deno).
- Docker-friendly structure for containerized deployment.

Repository layout
-----------------
Top-level:

- `apps/` — microservices and frontend
      - `ai-service/` — Python FastAPI service for AI features (requirements.txt, src/)
      - `api-gateway/` — TypeScript Nest/Express gateway (src/)
      - `order-service/`, `inventory-service/`, `notification-service/`, `finance-service/`, `staff-service/`, `whatsapp-service/` — Node.js services (each has `package.json` and `src/`)
      - `web/` — React + Vite frontend (src/, public/)
- `supabase/` — SQL migrations, edge functions, storage config
      - `migrations/` — numbered SQL migrations and `combined_migration.sql`
      - `functions/` — Supabase Edge Functions (Deno TypeScript)
- `docker-compose.yml` — dev compose for services and Redis
- `implementation_plan.md` — project plan and phased implementation notes

Database and Migrations
-----------------------
All DDL, RLS policies, triggers, and publication wiring live in `supabase/migrations`. A combined file `supabase/migrations/combined_migration.sql` collects the full schema to apply in one go (useful for manual paste into Supabase SQL editor).

Important objects and notes:

- `profiles` and `businesses`: multi-tenant foundations. Many policies use a helper function `public.get_user_business_id()` to resolve the current user's business.
- `whatsapp_messages`: stores inbound/outbound WhatsApp records (see `010_whatsapp_messages.sql`). Includes indexes and RLS policies.
- Publication: `supabase_realtime` includes key tables such as `orders`, `order_items`, `inventory_stock`, `notifications`, and `whatsapp_messages` so the frontend can subscribe to `postgres_changes`.
- Triggers: `update_updated_at_column()` is used across tables to maintain `updated_at` timestamps. Ledger triggers and invoice/payment triggers are present for accounting consistency.

Applying migrations (recommended order)

1. If using Supabase dashboard: open `supabase/migrations/combined_migration.sql` and paste/run the SQL.
2. Or from a machine with `psql` and access to the database, set `PGPASSWORD` and run from the `supabase/migrations` directory so `\i` includes resolve correctly:

```powershell
$env:PGPASSWORD="<DB_PASSWORD>"
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -p <DB_PORT> -f combined_migration.sql
```

Notes:
- Running the combined file multiple times will produce "already exists" notices for objects that are present; this is expected when re-applying to an existing database. Prefer a fresh database or use idempotent migration tooling.
- Some migrations rely on helper SQL files in `supabase/migrations` (e.g., `000_helpers.sql`, `015_db_functions.sql`); run from that directory so includes are resolved.

Environment variables
---------------------
Set environment variables in `.env` files for local development or configure them in your deployment environment. Key variables used across services:

- Supabase
      - `VITE_SUPABASE_URL` — public Supabase URL (frontend)
      - `VITE_SUPABASE_ANON_KEY` — anon key (frontend)
      - `SUPABASE_SERVICE_ROLE_KEY` — service role key for server-side apps (keep secret)
      - `SUPABASE_PASSWORD` — DB password if using direct psql access in scripts

- WhatsApp / Meta Cloud
      - `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`

- Redis / Workers
      - `REDIS_URL` — e.g., `redis://localhost:6379`

- Internal services / dev
      - `ORDER_SERVICE_URL`, `INVENTORY_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `AI_SERVICE_URL`
      - `INTERNAL_SERVICE_KEY` — short-lived key used for internal service-to-service calls in dev

- App config
      - `NODE_ENV`, `PORT`, `JWT_SECRET`

See the sample `.env` at the repository root for all variables used by services.

Services and APIs
-----------------
All services expose simple JSON REST endpoints; common behavior is documented here.

1) Notification Service (`apps/notification-service`)
- Purpose: proxy WhatsApp sends, queue emails (placeholder), and store internal notifications.
- Key endpoints:
      - `POST /notifications/whatsapp` — proxy send to WhatsApp service
      - `GET /whatsapp/conversations?phone=<phone>&limit=<n>` — fetch recent conversation messages for a phone
      - `POST /whatsapp/messages` — insert a whatsapp message record (used by integrations/workers)
      - `POST /notifications/internal` — insert internal notification

2) Order Service (`apps/order-service`)
- Purpose: create orders, reserve inventory (via RPC `decrement_stock`), and order lifecycle transitions.
- Key endpoints:
      - `GET /orders`, `GET /orders/:id`
      - `POST /orders` — create an order (validates customer business)
      - `PATCH /orders/:id/status` — update order status with state-machine validation
      - `POST /orders/whatsapp/webhook` — webhook to create orders originating from WhatsApp; persists inbound message to `whatsapp_messages` before order creation

3) WhatsApp Service (`apps/whatsapp-service`) — integration with Meta Cloud (send/receive webhooks)
      - `POST /send` (or similar) — sends messages via Meta Cloud API (the notification service proxies to this)

4) AI Service (`apps/ai-service`) — FastAPI Python
      - `POST /parse` or model endpoints used for message parsing, forecasting, and conversation intelligence.

5) Frontend (`apps/web`)
- Built with Vite + React. Key client features:
      - `useRealtimeTable(table)` hook subscribes to Supabase realtime and returns `{ isLive, lastEvent, isFlashing }` for UI flashes and optimistic updates.
      - Orders list, Order detail with optimistic status updates, Inventory list with realtime stock flashes.
      - WhatsApp page with conversation view and composer that calls `GET /whatsapp/conversations` and `POST /notifications/whatsapp` or `/whatsapp/messages` as needed.

Running locally (development)
----------------------------
Prerequisites:

- Node.js (recommended 18+)
- Python 3.10+ (for `ai-service`) and `pip` (or use a venv)
- Redis for BullMQ (or set `REDIS_URL` to a running Redis)
- psql client if you want to run migrations locally

1) Install root dependencies for any service you plan to run. Example for notification service and order service:

```powershell
cd apps/notification-service
npm install
cd ../order-service
npm install
```

2) Start Supabase (use hosted Supabase or a local Postgres + Realtime setup). If using hosted Supabase, ensure you have applied `combined_migration.sql`.

3) Start Redis (if using workers):

```powershell
docker run -p 6379:6379 -d redis:7
```

4) Start services (in separate shells):

```powershell
cd apps/notification-service
npm run start

cd ../order-service
npm run start

cd ../whatsapp-service
npm run start

cd ../../web
npm install
npm run dev
```

Note: Some services expect an `Authorization: Bearer <token>` header and a valid profile in `profiles` table. For local testing create a profile via SQL or Supabase dashboard.

Integration testing (smoke tests)
--------------------------------
- Verify `GET /whatsapp/conversations?phone=<phone>` returns JSON (empty or messages).
- POST an inbound webhook to `POST /orders/whatsapp/webhook` with `{ from, items, notes }` and confirm an order is created and `whatsapp_messages` contains a record.
- Open the frontend (`http://localhost:5173` by default) and confirm realtime flashes on new `orders` or `whatsapp_messages`.

Workers and background jobs
---------------------------
Workers are implemented using BullMQ. To enable, set `REDIS_URL` and ensure dependencies are installed. Example job types:

- `order.created` — send notifications, create invoices, enqueue fulfillment tasks
- `order.status_changed` — notify customers and staff

Edge Functions
--------------
Supabase Edge Functions are in `supabase/functions`. They are Deno-based and intended for light serverless tasks, webhooks, and integrations.

Deployment
----------
High-level steps for production:

1. Provision Supabase project (or use existing hosted Supabase). Apply migrations (via SQL editor or CLI).
2. Configure environment variables and secrets in your deployment platform (e.g., Docker Compose, Kubernetes, or cloud provider).
3. Build and deploy Node.js services (containers or managed Node apps). Use `NODE_ENV=production` and ensure `SUPABASE_SERVICE_ROLE_KEY` is set.
4. Deploy frontend as static site (Vercel, Netlify, or static hosting) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured.
5. Deploy Supabase Edge Functions using `supabase` CLI or the dashboard.

Example Docker Compose (dev)
---------------------------
See `docker-compose.yml` at the repo root — it includes skeletons to run services and Redis in containers. Update to bind ports and set secrets.

Security and secrets
--------------------
- Keep `SUPABASE_SERVICE_ROLE_KEY` and DB admin credentials secret. Never commit them.
- Use `INTERNAL_SERVICE_KEY` for service-to-service auth in dev; replace with mTLS, JWTs, or cloud IAM in production.
- Configure Supabase RLS policies carefully; tests should confirm non-privileged tokens cannot read other businesses' data.

Troubleshooting
---------------
- "function public.get_user_business_id() does not exist" — ensure you ran helper migrations that create utility functions before policies that reference them; run migrations from `supabase/migrations` so includes resolve.
- "relation already exists" notices — expected if reapplying migrations; safe for idempotent re-runs but consider using a migration tool (pg-migrate or supabase migrations) for production.
- Realtime subscriptions not firing — confirm table is part of `supabase_realtime` publication and that the client is using the correct `realtime` params (see `apps/web/src/lib/supabaseClient.js`).

Developer notes
---------------
- Frontend optimistic updates use TanStack Query (`setQueriesData`) and the `useRealtimeTable` hook to reconcile server events.
- `apps/order-service/src/index.js` persists inbound WhatsApp messages to `whatsapp_messages` for conversation history.
- `apps/notification-service/src/index.js` provides `GET /whatsapp/conversations` and `POST /whatsapp/messages` for reading and writing conversation data.
- Tests are not yet added — recommend adding integration tests for:
      - webhook -> order creation flow
      - notification delivery job
      - RLS policy enforcement (using Supabase test tokens)

Next steps and checklist
------------------------
- [x] Phase 1 — DB migrations applied (run `supabase/migrations/combined_migration.sql`)
- [ ] Complete worker implementations and retry logic
- [ ] Harden service-to-service auth (replace `INTERNAL_SERVICE_KEY`)
- [ ] Add CI that runs migrations, lints, and integration tests
- [ ] Deploy Edge Functions and verify webhooks

Contacts and contributions
--------------------------
This repository is maintained by the BizOS implementation team. For questions or to contribute, open an issue or a pull request.

License
-------
See repository LICENSE if present. If none exists, add one appropriate to your needs (MIT is common for starter projects).

Files of interest (quick links)
------------------------------
- `supabase/migrations/combined_migration.sql` — full DB schema
- `apps/web/src/hooks/useRealtimeTable.js` — realtime subscription hook
- `apps/notification-service/src/index.js` — notification + whatsapp endpoints
- `apps/order-service/src/index.js` — order API and whatsapp webhook
- `apps/ai-service/` — AI model service (FastAPI)
- `docker-compose.yml` — dev compose

If you'd like, I can also:
- generate a minimal `CONTRIBUTING.md` and `DEVELOPMENT.md` with step-by-step dev environment setup,
- add integration tests for webhook and realtime flows,
- or prepare a Helm/Kubernetes manifest for production deployment.

---
Generated on: 2026-05-22
## ✨ Features

- **WhatsApp Order Intelligence** — Automatically parse orders from WhatsApp messages in Hindi, English, or Hinglish
- **AI Business Brain** — Conversational interface to query and manage your entire business
- **Smart Inventory** — Real-time stock tracking with AI-powered demand forecasting
- **Autonomous Collections** — AI agent that follows up on overdue payments via WhatsApp
- **GST-Compliant Invoicing** — Auto-generate invoices with proper CGST/SGST/IGST computation
- **Staff Management** — Attendance tracking, task assignment with Kanban boards
- **Voice & Image Processing** — Understand voice notes and scan invoices via OCR
- **Real-time Everything** — Live dashboard updates powered by Supabase Realtime

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  React SPA   │────▶│  API Gateway │────▶│  Supabase    │
│  (Vite)      │     │  (NestJS)    │     │  (PostgreSQL)│
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Order   │ │Inventory │ │ Finance  │
        │ Service  │ │ Service  │ │ Service  │
        └──────────┘ └──────────┘ └──────────┘
              │             │             │
              ▼             ▼             ▼
        ┌──────────────────────────────────────┐
        │       AI Service (FastAPI)           │
        │   LangGraph Agents + Gemini/Groq     │
        └──────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Supabase account (or local Supabase)

### Setup

```bash
# 1. Clone and enter the project
cd bizos

# 2. Copy environment variables
cp .env.example .env
# Fill in your API keys

# 3. Start all services with Docker
docker-compose up -d

# 4. Or run the frontend locally
cd apps/web
npm install
npm run dev
```

### Run Database Migrations

```bash
# Using Supabase CLI
supabase db push
supabase db seed
```

## 📁 Project Structure

```
bizos/
├── apps/
│   ├── web/                  ← React frontend (Vite)
│   ├── api-gateway/          ← NestJS API gateway
│   ├── order-service/        ← Order management
│   ├── inventory-service/    ← Stock & forecasting
│   ├── finance-service/      ← Invoices, ledger, GST
│   ├── staff-service/        ← Attendance & tasks
│   ├── notification-service/ ← WhatsApp, email, push
│   └── ai-service/           ← FastAPI + LangGraph agents
├── packages/
│   └── shared-types/         ← TypeScript interfaces
├── supabase/
│   ├── migrations/           ← SQL schema files
│   ├── functions/            ← Edge functions
│   └── seed/                 ← Demo data
├── docker-compose.yml
└── .env.example
```

## 🎨 Design System

- **Theme**: Dark-first luxury SaaS
- **Colors**: Charcoal base (#0D0D0F), Indigo accent (#6C63FF), Emerald success (#10B981)
- **Typography**: Inter (body), JetBrains Mono (numbers)
- **Components**: Shadcn/UI with custom dark overrides
- **Animations**: Framer Motion (fade, slide, stagger)

## 🤖 AI Agents

| Agent | Purpose |
|-------|---------|
| Order Agent | Parse & create orders from natural language |
| Inventory Agent | Stock queries, reorder suggestions |
| Finance Agent | Invoice generation, P&L queries |
| Collections Agent | Automated payment follow-ups |
| Analytics Agent | Business insights & reports |
| Customer Agent | Customer behavior analysis |
| Staff Agent | Task assignment & attendance |

## 📊 Demo Data

Run the seed file to populate a demo business: **"Sharma Hardware Stores, Ahmedabad"** with 20 products, 10 customers, 30 days of order history, and sample AI insights.

## 🇮🇳 Made in India

Built for Indian SMBs with GST compliance, Hindi/Hinglish NLP support, UPI payments, and WhatsApp-first workflows.

## 📝 License

Proprietary — All rights reserved.
