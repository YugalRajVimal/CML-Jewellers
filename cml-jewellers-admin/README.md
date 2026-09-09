<!-- # CML Jewellers — Admin Panel

Operations console for CML Jewellers: products, categories, inventory, purchases,
orders, returns, refunds, customers, coupons, homepage content, and RBAC —
built from the project's Architecture Overview, API Contract, Data Models and
State Machine specs, and wired to talk to the real backend over HTTP.

## Stack
Next.js 15 (App Router) + TypeScript + Tailwind CSS + lucide-react + recharts.

## Getting started

```bash
cp .env.local.example .env.local
# edit .env.local with your backend's URL
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on `/login`. Signing in requires the
real backend to be running and reachable at the URL in `.env.local`.

## Environment

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | `https://api.cmljewellers.com/api/v1` | The API **root** — no trailing slash, no `/admin` suffix. The client appends `/admin` and `/auth` itself, per PART 5's "Base URL: `/api/v1` (admin under `/api/v1/admin`)". |

If unset, it falls back to `http://localhost:4000/api/v1` for local backend dev.

## Architecture

- `src/lib/types.ts` — TypeScript types mirroring PART 6 (Shared Data Models).
- `src/lib/state-machines.ts` — transition tables for Order/Return/Refund from
  PART 7. Used client-side to disable illegal transition buttons before the
  round-trip; the backend remains the source of truth and re-validates.
- `src/lib/http.ts` — the low-level fetch client: builds `ADMIN_BASE`/`AUTH_BASE`
  from the env var, attaches the bearer token from memory, parses the
  `{ success, message, data, meta }` / `{ success:false, message, error }`
  envelope from PART 5, and retries once on a 401 via a silent refresh.
- `src/lib/api.ts` — one typed function per endpoint (products, categories,
  inventory, purchases, orders, payments, sales, returns, refunds, customers,
  coupons, content, roles, admin users, audit log). Every page imports from
  here only — nothing talks to `fetch` directly.
- `src/lib/auth.tsx` — session + RBAC context (`useAuth().can(permission)`).
  On mount it silently calls `POST /admin/auth/refresh` (using the httpOnly refresh
  cookie the backend sets on login) to mint an access token without the user
  re-entering credentials; the access token itself lives only in memory
  (`src/lib/http.ts`), never in localStorage.
- `src/lib/mock-data.ts` — **no longer used by the app.** Left in the repo as
  a reference for collection shapes / seed data, and as a base if you ever
  want an offline demo mode again.
- `src/components/` — shared UI: sidebar (permission-filtered nav), topbar,
  data table (sort/paginate/loading/empty), status pills, RBAC gate.
- `src/app/(dashboard)/*` — one route per module, matching the Epic
  breakdown: dashboard, products, categories, inventory, purchases, orders,
  payments, sales, returns, refunds, customers, coupons, content, roles,
  audit-log.

## Backend contract assumptions

The provided API Contract doc doesn't pin down every exact shape (login
response, toggle actions, etc). `src/lib/api.ts` is fully wired against
reasonable REST conventions, with each assumption marked inline with
`// ASSUMPTION:`. Summary — confirm these with whoever owns the backend, and
only `src/lib/api.ts` needs to change if any differ:

| Area | Assumption |
|---|---|
| `POST /admin/auth/login` | **Not** `/auth/login` — that's the customer OTP flow. Per the architecture doc the admin panel only ever talks to `/api/v1/admin`, and admin auth is its own JWT namespace (`aud: admin`, password-only, no OTP), so login must be nested under `/admin`. Body `{ email, password }` → `data: { accessToken, admin, role }`. Refresh token arrives as an httpOnly cookie, not in the JSON body. |
| `POST /admin/auth/refresh` | No body (reads the refresh cookie) → `data: { accessToken, admin, role }`. Used both for silent bootstrap on page load and for retry-after-401. |
| `POST /admin/auth/logout` | No body; invalidates the refresh cookie server-side. |
| Boolean toggles (`isFeatured`, `isActive` on coupons/banners/homepage sections, admin user `status`) | No dedicated toggle endpoint assumed — the client does a `GET` then `PATCH` with the flipped value. Trivial to swap for a `POST /:id/toggle` if the backend adds one. |
| `POST /admin/purchases/:id/receive` | Not in the contract table; assumed as the action to mark a PO received and bump inventory. Alternative: `PATCH /admin/purchases/:id { status: "Received" }`. |
| `GET /admin/customers/:id` | Assumed to return `{ customer, orders }` with order history embedded. |
| `GET /admin/audit-log` | Implied by Epic 5's audit log viewer requirement but not in the contract table; path assumed as `/admin/audit-log`. |
| `GET /admin/payments` | Implied by Epic 4's "Payment/transaction views" requirement; path assumed as `/admin/payments`. |
| `GET /admin/sales` | Returns `{ trend, byCategory, topProducts, totalRevenue, avgOrderValue, orderCount }` for the Sales page. |

## What's implemented

All 5 epics from the Admin Panel Development Prompt are covered:

- **Epic 1 — Foundation:** auth (cookie refresh + in-memory access token), RBAC-filtered sidebar, 403 UI on unauthorized routes, typed API client, dashboard shell.
- **Epic 2 — Products, Categories & Inventory:** full CRUD on products and categories (create/edit/delete, with guardrails — e.g. a category with products or subcategories can't be deleted), inventory adjustments with a transaction log, low-stock view.
- **Epic 3 — Purchases, Orders & Sales:** supplier CRUD, purchase-order creation and receiving (updates inventory), order list/detail with state-machine-gated transitions, a dedicated Sales page (monthly revenue, category split, top products).
- **Epic 4 — Payments, Returns & Customers:** a Payments list (Cashfree provider refs/status), return approve/reject/inspect/refund workflow, refund transitions, customer list **and detail page with order history**, full coupon CRUD.
- **Epic 5 — Analytics, Content & RBAC:** dashboard KPIs/trend, homepage sections + banner management, admin user invite/suspend, **and a full RBAC editor** — create new roles or edit an existing role's permissions via checkboxes grouped by module (the built-in Super Admin role is locked, matching a typical "can't lock yourself out" safeguard).

## Known simplifications

- No real image upload UI yet — Cloudinary integration is stubbed with a
  placeholder in the product detail view, per the MediaService abstraction in
  the architecture doc. Wiring an upload widget is a small addition once the
  backend's upload endpoint exists.
- Product variant management is view-only (variants are visible per product;
  adding/removing a variant would be the next increment).
- Illegal state transitions (order/return/refund) are checked client-side
  against the same tables in `src/lib/state-machines.ts` before the request is
  sent, purely for instant UI feedback — the backend must still enforce this
  independently, since a client-side check is not a security boundary. -->

  # CML Jewellers — Admin Panel

Operations console for CML Jewellers: products, categories, inventory, purchases,
orders, returns, refunds, customers, coupons, homepage content, and RBAC —
built from the project's Architecture Overview, API Contract, Data Models and
State Machine specs, and wired to talk to the real backend over HTTP.

## Stack
Next.js 15 (App Router) + TypeScript + Tailwind CSS + lucide-react + recharts.

## Getting started

```bash
cp .env.local.example .env.local
# edit .env.local with your backend's URL
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on `/login`. Signing in requires the
real backend to be running and reachable at the URL in `.env.local`.

## Environment

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | `https://api.cmljewellers.com/api/v1` | The API **root** — no trailing slash, no `/admin` suffix. The client appends `/admin` and `/auth` itself, per PART 5's "Base URL: `/api/v1` (admin under `/api/v1/admin`)". |

If unset, it falls back to `http://localhost:4000/api/v1` for local backend dev.

## Architecture

- `src/lib/types.ts` — TypeScript types mirroring PART 6 (Shared Data Models).
- `src/lib/state-machines.ts` — transition tables for Order/Return/Refund from
  PART 7. Used client-side to disable illegal transition buttons before the
  round-trip; the backend remains the source of truth and re-validates.
- `src/lib/http.ts` — the low-level fetch client: builds `ADMIN_BASE`/`AUTH_BASE`
  from the env var, attaches the bearer token, parses the
  `{ success, message, data, meta }` / `{ success:false, message, error }`
  envelope from PART 5, and clears the session on a 401 (no refresh flow —
  see below).
- `src/lib/api.ts` — one typed function per endpoint (products, categories,
  inventory, purchases, orders, payments, sales, returns, refunds, customers,
  coupons, content, roles, admin users, audit log). Every page imports from
  here only — nothing talks to `fetch` directly.
- `src/lib/auth.tsx` — session + RBAC context (`useAuth().can(permission)`).
  There's no refresh flow for admin auth (the architecture doc only calls one
  out for the customer flow), so the access token is persisted client-side
  (`localStorage`, via `src/lib/http.ts`) and restored on page load without a
  network round-trip; a 401 from any request clears it and bounces to
  `/login`.
- `src/lib/mock-data.ts` — **no longer used by the app.** Left in the repo as
  a reference for collection shapes / seed data, and as a base if you ever
  want an offline demo mode again.
- `src/components/` — shared UI: sidebar (permission-filtered nav), topbar,
  data table (sort/paginate/loading/empty), status pills, RBAC gate.
- `src/app/(dashboard)/*` — one route per module, matching the Epic
  breakdown: dashboard, products, categories, inventory, purchases, orders,
  payments, sales, returns, refunds, customers, coupons, content, roles,
  audit-log.

## Backend contract assumptions

The provided API Contract doc doesn't pin down every exact shape (login
response, toggle actions, etc). `src/lib/api.ts` is fully wired against
reasonable REST conventions, with each assumption marked inline with
`// ASSUMPTION:`. Summary — confirm these with whoever owns the backend, and
only `src/lib/api.ts` / `src/lib/http.ts` need to change if any differ:

| Area | Assumption |
|---|---|
| `POST /admin/auth/login` | **Not** `/auth/login` — that's the customer OTP flow. Per the architecture doc the admin panel only ever talks to `/api/v1/admin`, and admin auth is its own JWT namespace (`aud: admin`, password-only, no OTP), so login must be nested under `/admin`. Body `{ email, password }` → `data: { accessToken, admin, role }`. |
| No refresh endpoint | The architecture doc spells out a refresh token + httpOnly cookie for the *customer* flow but says admin auth is just "password + optional 2FA later" — no refresh is called out. So there's no `POST /admin/auth/refresh`: the access token is persisted client-side and used until it expires or the backend 401s, at which point the person logs in again. **If the backend does add a refresh token for admin**, reintroduce it in `src/lib/http.ts` (store the token in memory instead of localStorage, add a refresh-and-retry step on 401) rather than `api.ts`. |
| `POST /admin/auth/logout` | Best-effort — the client clears its local token regardless of whether this call succeeds, since a stateless JWT isn't server-revocable without a session store. |
| Boolean toggles (`isFeatured`, `isActive` on coupons/banners/homepage sections, admin user `status`) | No dedicated toggle endpoint assumed — the client does a `GET` then `PATCH` with the flipped value. Trivial to swap for a `POST /:id/toggle` if the backend adds one. |
| `POST /admin/purchases/:id/receive` | Not in the contract table; assumed as the action to mark a PO received and bump inventory. Alternative: `PATCH /admin/purchases/:id { status: "Received" }`. |
| `GET /admin/customers/:id` | Assumed to return `{ customer, orders }` with order history embedded. |
| `GET /admin/audit-log` | Implied by Epic 5's audit log viewer requirement but not in the contract table; path assumed as `/admin/audit-log`. |
| `GET /admin/payments` | Implied by Epic 4's "Payment/transaction views" requirement; path assumed as `/admin/payments`. |
| `GET /admin/sales` | Returns `{ trend, byCategory, topProducts, totalRevenue, avgOrderValue, orderCount }` for the Sales page. |

**Security note:** persisting the access token in `localStorage` (rather than
memory-only) is a direct consequence of there being no refresh flow to fall
back on — it trades a bit of XSS exposure for not logging admins out on every
tab refresh. If that tradeoff is unacceptable, the fix is on the backend side
(add a refresh token), not something to route around client-side.

## What's implemented

All 5 epics from the Admin Panel Development Prompt are covered:

- **Epic 1 — Foundation:** auth (persisted access token, no refresh flow — see above), RBAC-filtered sidebar, 403 UI on unauthorized routes, typed API client, dashboard shell.
- **Epic 2 — Products, Categories & Inventory:** full CRUD on products and categories (create/edit/delete, with guardrails — e.g. a category with products or subcategories can't be deleted), inventory adjustments with a transaction log, low-stock view.
- **Epic 3 — Purchases, Orders & Sales:** supplier CRUD, purchase-order creation and receiving (updates inventory), order list/detail with state-machine-gated transitions, a dedicated Sales page (monthly revenue, category split, top products).
- **Epic 4 — Payments, Returns & Customers:** a Payments list (Cashfree provider refs/status), return approve/reject/inspect/refund workflow, refund transitions, customer list **and detail page with order history**, full coupon CRUD.
- **Epic 5 — Analytics, Content & RBAC:** dashboard KPIs/trend, homepage sections + banner management, admin user invite/suspend, **and a full RBAC editor** — create new roles or edit an existing role's permissions via checkboxes grouped by module (the built-in Super Admin role is locked, matching a typical "can't lock yourself out" safeguard).

## Known simplifications

- No real image upload UI yet — Cloudinary integration is stubbed with a
  placeholder in the product detail view, per the MediaService abstraction in
  the architecture doc. Wiring an upload widget is a small addition once the
  backend's upload endpoint exists.
- Product variant management is view-only (variants are visible per product;
  adding/removing a variant would be the next increment).
- Illegal state transitions (order/return/refund) are checked client-side
  against the same tables in `src/lib/state-machines.ts` before the request is
  sent, purely for instant UI feedback — the backend must still enforce this
  independently, since a client-side check is not a security boundary.