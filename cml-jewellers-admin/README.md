# CML Jewellers — Admin Panel

Operations console for CML Jewellers: products, categories, inventory, purchases,
orders, returns, refunds, customers, coupons, homepage content, and RBAC —
built from the project's Architecture Overview, API Contract, Data Models and
State Machine specs.

## Stack
Next.js 15 (App Router) + TypeScript + Tailwind CSS + lucide-react + recharts.

## Getting started
```bash
npm install
npm run dev
```
Open http://localhost:3000 — you'll land on `/login`.

### Demo accounts (RBAC roles)
| Role | Email | Password |
|---|---|---|
| Super Admin (all permissions) | meera@cmljewellers.com | super123 |
| Catalog Manager (products/categories/inventory) | rohan@cmljewellers.com | catalog123 |
| Operations (orders/purchases/returns/refunds) | priya@cmljewellers.com | ops123 |

Sidebar items and page access are filtered live by the signed-in role's permissions
(see `src/lib/mock-data.ts` → `ROLES`). Visiting a module without permission (e.g.
open a Catalog Manager session and try `/roles`) renders a 403 state instead of
the page.

## Architecture

- `src/lib/types.ts` — TypeScript types mirroring PART 6 (Shared Data Models).
- `src/lib/state-machines.ts` — transition tables for Order/Return/Refund from
  PART 7, enforced with `canTransition()` on every mutation.
- `src/lib/mock-data.ts` — an in-memory dataset standing in for MongoDB, shaped
  like the real collections (products, variants, inventory, orders, etc).
- `src/lib/api.ts` — a typed client for `/api/v1/admin/*` that returns the exact
  `{ success, message, data, meta }` / `{ success:false, message, error }`
  envelopes from PART 5 (API Contract). **This is the swap-out point**: point
  `ADMIN_API_BASE_URL` at the real backend and replace each function body with
  a `fetch()` call — every page only depends on the returned shape, not on how
  it was produced.
- `src/lib/auth.tsx` — session + RBAC context (`useAuth().can(permission)`),
  currently backed by the mock login; swap for real JWT (`aud: admin`) handling
  against `/auth/login` when the backend exists.
- `src/components/` — shared UI: sidebar (permission-filtered nav), topbar,
  data table (sort/paginate/loading/empty), status pills, RBAC gate.
- `src/app/(dashboard)/*` — one route per module, matching the Epic breakdown:
  dashboard, products, categories, inventory, purchases, orders, returns,
  refunds, customers, coupons, content, roles, audit-log.

## What's implemented

All 5 epics from the Admin Panel Development Prompt are covered:

- **Epic 1 — Foundation:** auth, RBAC-filtered sidebar, 403 UI on unauthorized routes, typed API client, dashboard shell.
- **Epic 2 — Products, Categories & Inventory:** full CRUD on products and categories (create/edit/delete, with guardrails — e.g. a category with products or subcategories can't be deleted), inventory adjustments with a transaction log, low-stock view.
- **Epic 3 — Purchases, Orders & Sales:** supplier CRUD, purchase-order creation and receiving (updates inventory), order list/detail with state-machine-gated transitions, a dedicated Sales page (monthly revenue, category split, top products).
- **Epic 4 — Payments, Returns & Customers:** a Payments list (Cashfree provider refs/status), return approve/reject/inspect/refund workflow, refund transitions, customer list **and detail page with order history**, full coupon CRUD.
- **Epic 5 — Analytics, Content & RBAC:** dashboard KPIs/trend, homepage sections + banner management, admin user invite/suspend, **and a full RBAC editor** — create new roles or edit an existing role's permissions via checkboxes grouped by module (the built-in Super Admin role is locked, matching a typical "can't lock yourself out" safeguard).

All mutations run through the state machines / validation in `src/lib/api.ts` (illegal order/return/refund transitions are rejected, duplicate SKUs/coupon codes/category names are rejected, categories with children or products can't be deleted, etc).

## Known simplifications (by design, for a mock-backed panel)

- No real image upload — Cloudinary integration is stubbed with a placeholder in the product detail view, per the MediaService abstraction in the architecture doc.
- Product variant management is view-only (variants are visible per product; adding/removing a variant would be the next increment).
- All data lives in memory (`src/lib/mock-data.ts`) and resets on server restart — this is intentional until the real backend is wired in (see below).


## Connecting the real backend

1. Set `NEXT_PUBLIC_ADMIN_API_BASE_URL` in `.env.local`.
2. In `src/lib/api.ts`, replace the body of each exported function with a
   `fetch(`${BASE_URL}/admin/...`, { headers: { Authorization: \`Bearer ${token}\` } })`
   call, keeping the same return shape (`ApiResponse<T>`).
3. In `src/lib/auth.tsx`, replace `api.login` with a real call to
   `POST /auth/login` and store the returned access/refresh tokens instead of
   the mock session object.

No other file needs to change — pages and components only talk to `src/lib/api.ts`.
