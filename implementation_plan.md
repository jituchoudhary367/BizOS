# BizOS Production Migration — Full Supabase Wiring

> Transform BizOS from demo/mock mode to production-grade realtime with full Supabase persistence across every layer.

## Current State Assessment

### What Exists (Scaffolded)
| Layer | Status | Key Files |
|-------|--------|-----------|
| **14 SQL migrations** | Schema defined, NOT pushed to Supabase | `supabase/migrations/001-014` |
| **Frontend (React+Vite)** | Full UI built with demo/mock data, `setDemoMode()` fallback | `apps/web/src/` — 12 pages, hooks, stores |
| **Order Service** | Basic CRUD implemented, uses service role | `apps/order-service/src/index.js` (212 lines) |
| **Inventory Service** | Basic CRUD, some column mismatches vs schema | `apps/inventory-service/src/index.js` (147 lines) |
| **Finance Service** | Basic CRUD, references `finance_ledger` (doesn't exist in schema — schema has `ledger_entries`) | `apps/finance-service/src/index.js` (193 lines) |
| **Staff Service** | Package.json only, **no src/index.js** | `apps/staff-service/` |
| **Notification Service** | Package.json only, **no src/index.js** | `apps/notification-service/` |
| **WhatsApp Service** | Full webhook handler + send endpoint | `apps/whatsapp-service/src/index.js` (183 lines) |
| **AI Service (FastAPI)** | Brain, WhatsApp parser, LangGraph builder | `apps/ai-service/src/` (6 files) |
| **API Gateway (NestJS)** | Auth guard + proxy module scaffolded, missing `business/` and `health/` modules | `apps/api-gateway/src/` |
| **Edge Functions** | 3 functions scaffolded (generate-invoice, send-whatsapp, trigger-agent) | `supabase/functions/` |
| **Supabase Client** | Singleton initialized with env vars | `apps/web/src/lib/supabaseClient.js` |
| **Realtime Hook** | Basic implementation exists but missing `isLive`, flash animation, sound | `apps/web/src/hooks/useRealtimeTable.js` |
| **AI Stream Hook** | Basic SSE implementation exists | `apps/web/src/hooks/useAIStream.js` |
| **Auth Store** | Full Supabase auth with phone OTP + Google OAuth | `apps/web/src/store/authStore.js` |

### Critical Gaps
1. **Migrations NOT pushed** — no tables exist in Supabase yet
2. **No DB functions/triggers** — `update_updated_at()`, inventory triggers, ledger triggers all missing
3. **No pg_cron jobs** — overdue invoices, stock checks, risk scores not automated
4. **No realtime publication** — `ALTER PUBLICATION` not run, no `REPLICA IDENTITY FULL`
5. **No `get_user_business_id()` helper** — RLS policies use repeated subqueries
6. **Missing services** — staff-service and notification-service have no source code
7. **Column mismatches** — inventory service references `quantity_on_hand` but schema has `quantity`; finance service references `finance_ledger` but schema has `ledger_entries`/`payments`
8. **No BullMQ workers** — all services lack queue-based async processing
9. **Frontend uses demo mode** — App.jsx falls back to `setDemoMode()` on any auth failure
10. **No storage buckets** — `bizos-assets` and `bizos-invoices` not created
11. **Gateway missing modules** — `BusinessModule` and `HealthModule` referenced in `app.module.ts` but directories don't exist

---

## User Review Required

> [!IMPORTANT]
> **Database Password Required**: To push migrations, I need the Supabase database password. The Supabase MCP server you provided failed to connect (timeout). Options:
> 1. **Provide your Supabase personal access token** (format `sbp_xxxx...`) so I can use `supabase login` + `supabase db push`
> 2. **Provide the database password** so I can connect directly via `postgresql://postgres:PASSWORD@db.wjdyyiuanbptcubetrdu.supabase.co:5432/postgres`
> 3. **Run the migration SQL manually** in the Supabase SQL Editor — I'll generate one combined SQL file

> [!WARNING]
> **API Keys**: The following services require real API keys to work in production:
> - `GEMINI_API_KEY` — for AI Brain, WhatsApp parsing, reports
> - `GROQ_API_KEY` — for fast intent classification, transcription
> - `META_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` — for WhatsApp Cloud API
> - `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — for payment links
> Without these, the AI and WhatsApp features will gracefully degrade but won't function.

> [!CAUTION]
> **Scope Warning**: This spec describes ~150+ files across 12 layers. I'll execute in phases, starting with the database (foundation) and working up. Each phase is independently valuable. Full completion will require multiple sessions.

---

## Open Questions

1. **Which migration approach?** — Do you have a Supabase personal access token, or should I generate one combined SQL file for you to paste into the SQL Editor?
2. **pg_cron availability** — Is the `pg_cron` extension already enabled in your Supabase project? (Required for scheduled jobs)
3. **Storage buckets** — Should I create these programmatically via the Supabase client or do you want to create them manually in the dashboard?
4. **WhatsApp Cloud API** — Do you have a Meta Business account with WhatsApp Cloud API access configured? If not, the WhatsApp pipeline will be structurally complete but won't send/receive real messages.

---

## Proposed Changes

### Phase 1: Supabase Database Foundation
The foundation everything else builds on. Must be done first.

---

#### [NEW] `supabase/migrations/000_helpers.sql`
- Create `get_user_business_id()` function
- Create `update_updated_at_column()` trigger function (already in 001, will consolidate)

#### [MODIFY] `supabase/migrations/001_auth_profiles.sql` through `014_notifications.sql`
- Fix column names to be consistent across all layers
- Add `REPLICA IDENTITY FULL` for realtime-enabled tables
- Consolidate `ALTER PUBLICATION supabase_realtime ADD TABLE` statements

#### [NEW] `supabase/migrations/015_db_functions.sql`
- `update_customer_outstanding()` — trigger on `ledger_entries` AFTER INSERT
- `update_inventory_on_order_confirm()` — trigger on `orders` AFTER UPDATE
- `release_inventory_on_order_cancel()` — trigger on `orders` AFTER UPDATE
- `create_ledger_on_invoice()` — trigger on `invoices` AFTER INSERT
- `create_ledger_on_payment()` — trigger on `payments` AFTER INSERT
- `decrement_stock()` — RPC function called by order service

#### [NEW] `supabase/migrations/016_pg_cron_jobs.sql`
- `flag_overdue_invoices()` — daily at 6 AM IST
- `check_inventory_thresholds()` — every 2 hours
- `calculate_customer_risk_scores()` — nightly at midnight
- `evaluate_workflow_triggers()` — every 15 minutes

#### [NEW] `supabase/migrations/017_realtime_and_rls.sql`
- `ALTER PUBLICATION supabase_realtime ADD TABLE` for all 13 tables
- `REPLICA IDENTITY FULL` on all realtime tables
- Updated RLS policies using `get_user_business_id()` helper
- Role-based policies for `agent_logs`, `ai_conversations`, `ai_insights`, `workflow_triggers`

#### [NEW] `supabase/migrations/018_storage.sql`
- Create `bizos-assets` bucket (public read, authenticated write)
- Create `bizos-invoices` bucket (authenticated read only)
- Storage RLS policies

#### [NEW] `supabase/migrations/combined_migration.sql`
- Single file combining all migrations for manual SQL Editor paste

---

### Phase 2: Backend Services — Complete Wiring

---

#### [MODIFY] [index.js](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/order-service/src/index.js)
- Fix column references to match schema (`product_name` in order_items)
- Add WhatsApp webhook endpoint (`POST /orders/whatsapp/webhook`)
- Add BullMQ workers for `order.created` and `order.status_changed`
- Add order state machine validation
- Add credit limit check on order creation

#### [MODIFY] [index.js](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/inventory-service/src/index.js)
- Fix column names: `quantity_on_hand` → `quantity`, `quantity_reserved` → `reserved_quantity`
- Add `warehouse_id` support throughout
- Add purchase order endpoints (`POST /purchase-orders`, `PATCH /purchase-orders/:id/receive`)
- Add stock take endpoint (`POST /stock/take`)
- Add forecast endpoint calling AI service
- Add BullMQ worker for auto-PO generation

#### [MODIFY] [index.js](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/finance-service/src/index.js)
- Replace `finance_ledger` references with `payments` + `ledger_entries` tables
- Add `POST /payments` using correct schema
- Add `GET /ledger/:entity_type/:entity_id`
- Add `GET /cashflow` with proper date range aggregation
- Add `POST /collections/remind/:customer_id`
- Add BullMQ worker for `collections.auto_followup`

#### [NEW] `apps/staff-service/src/index.js`
- `POST /attendance/checkin` — with late detection
- `POST /attendance/checkout` — with half-day detection
- `GET /attendance` — with filters and monthly aggregation
- `POST /tasks` — create with notification
- `PATCH /tasks/:id/status` — state machine + notification
- BullMQ worker for overdue task detection

#### [NEW] `apps/notification-service/src/index.js`
- `POST /notifications/internal` — insert to notifications table
- `POST /notifications/whatsapp` — call WhatsApp service
- `POST /notifications/email` — Nodemailer/Resend
- `GET /notifications` — unread for current user
- `PATCH /notifications/:id/read` — mark read
- `PATCH /notifications/read-all` — mark all read

#### [MODIFY] [app.module.ts](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/api-gateway/src/app.module.ts)
- Create `BusinessModule` with business context middleware
- Create `HealthModule` with aggregated health endpoint
- Fix proxy routes per spec
- Add WebSocket gateway at `/ws`
- Add Redis adapter for Socket.IO

---

### Phase 3: Supabase Edge Functions

---

#### [MODIFY] `supabase/functions/generate-invoice/index.ts`
- Full GST-compliant invoice PDF generation
- Upload to `bizos-invoices` storage
- Update `invoices.pdf_url`

#### [MODIFY] `supabase/functions/send-whatsapp/index.ts`
- Generic outbound WhatsApp via Meta Cloud API
- Insert outbound record into `whatsapp_messages`

#### [MODIFY] `supabase/functions/trigger-agent/index.ts`
- Call AI service `/ai/agents/{agent_name}`
- Return agent result

#### [NEW] `supabase/functions/process-whatsapp-message/index.ts`
- Called by `notify_new_whatsapp_message` trigger via `pg_net`
- Calls AI service for parsing
- Creates order via order service
- Sends confirmation via WhatsApp

#### [NEW] `supabase/functions/create-payment-link/index.ts`
- Razorpay payment link creation
- Update `invoices.payment_link`

---

### Phase 4: Frontend — Full Realtime Wiring

---

#### [MODIFY] [useRealtimeTable.js](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/web/src/hooks/useRealtimeTable.js)
- Add `isLive` state tracking
- Add optimistic cache updates (INSERT/UPDATE/DELETE)
- Add row flash animation class
- Add notification sound for orders/whatsapp_messages

#### [MODIFY] [useAIStream.js](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/web/src/hooks/useAIStream.js)
- Add session management
- Add `confirmation_required` SSE event handling
- Add `action_card` rendering support
- Persist conversations to `ai_conversations`

#### [MODIFY] [App.jsx](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/web/src/App.jsx)
- Remove `setDemoMode()` fallback — require real auth
- Add `onAuthStateChange` listener for SIGNED_OUT
- Add offline detection banner
- Proactive JWT refresh

#### [MODIFY] [authStore.js](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/web/src/store/authStore.js)
- Remove demo mode entirely
- Add proper redirect after login
- Clear TanStack Query cache on sign out

#### [MODIFY] All page components
- Add `useRealtimeTable` subscriptions per spec (Dashboard, Orders, Inventory, Finance, Agents)
- Convert mock data fetches to real Supabase queries via TanStack Query
- Add optimistic mutations for all write operations

---

### Phase 5: AI Service Enhancement

---

#### [MODIFY] [main.py](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/ai-service/src/main.py)
- Add JWT validation middleware
- Add `POST /ai/transcribe` — Groq Whisper
- Add `POST /ai/forecast/product` — demand forecasting
- Add `POST /ai/agents/{agent_name}` — named agent execution
- Add `POST /ai/ocr` — PaddleOCR
- Add `GET /ai/generate-report` — SSE streaming report
- Add `POST /ai/brain/confirm` — confirmation flow

#### [MODIFY] [brain.py](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/ai-service/src/brain.py)
- Add Redis-cached business context (5 min TTL)
- Add intent classification via Groq
- Add tool definitions for all Supabase queries
- Add confirmation flow with Redis-stored pending actions
- Add conversation persistence

#### [NEW] `apps/ai-service/src/llm_router.py`
- LLM routing: Groq for fast tasks, Gemini for deep reasoning
- Automatic fallback on rate limits
- Transparent logging of model used

#### [NEW] `apps/ai-service/src/tools.py`
- All read tools: `get_orders`, `get_customers`, `get_products`, etc.
- All write tools: `create_order`, `create_invoice`, `send_reminder`, etc.
- Confirmation threshold checks

#### [MODIFY] [graph_builder.py](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/ai-service/src/graph_builder.py)
- Implement all agent types: order, inventory, finance, collections, analytics, customer, staff
- Add orchestrator supervisor graph
- Implement multi-step pipelines (e.g., order → invoice → WhatsApp)

---

### Phase 6: WhatsApp Pipeline End-to-End

---

#### [MODIFY] [index.js](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/apps/whatsapp-service/src/index.js)
- Fix column names to match schema (`from_number`/`to_number` vs `from`/`to`)
- Add voice note handling (download + transcribe)
- Add image handling (download + OCR)
- Add unknown customer creation
- Move webhook to order-service per spec (or keep separate — see open question)

---

### Phase 7: Docker & Deployment

---

#### [MODIFY] [docker-compose.yml](file:///c:/Users/Jitendra%20Chaudhary/OneDrive/Desktop/BizOS/docker-compose.yml)
- Add WhatsApp service container
- Add health checks for all services
- Add `SUPABASE_URL` env var mapping (currently uses `SUPABASE_URL` but env has `VITE_SUPABASE_URL`)
- Fix port mappings (WhatsApp on 3004 conflicts with staff-service on 3004)
- Add shared Docker network `bizos-net`

---

## Verification Plan

### Automated Tests
1. Push migrations → verify all 30+ tables exist via `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
2. Test RLS policies: insert as user A, select as user B → expect 0 rows
3. Test triggers: insert payment → verify ledger_entry auto-created
4. Test realtime: subscribe to orders channel → insert order → verify event received
5. Run `npm run dev` for web app → verify no console errors, auth flow works

### Manual Verification
1. Sign up with phone → verify profile + business created
2. Create an order → verify it appears in real-time on Dashboard
3. Mark invoice as paid → verify ledger entry auto-created, status animation
4. Send AI Brain message → verify SSE streaming response
5. Check Supabase dashboard: tables populated, RLS active, realtime channels subscribed

---

## Execution Priority

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Phase 1: DB Foundation | ~2 hours | Unblocks everything |
| 🔴 P0 | Phase 2: Backend Services | ~4 hours | Data layer works |
| 🟡 P1 | Phase 4: Frontend Realtime | ~3 hours | User-facing value |
| 🟡 P1 | Phase 3: Edge Functions | ~2 hours | Automation works |
| 🟢 P2 | Phase 5: AI Enhancement | ~4 hours | Brain/agents work |
| 🟢 P2 | Phase 6: WhatsApp Pipeline | ~2 hours | WhatsApp works |
| ⚪ P3 | Phase 7: Docker & Deploy | ~1 hour | Production ready |
