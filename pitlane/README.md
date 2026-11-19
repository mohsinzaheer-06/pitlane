# PITLANE — Motorsport Streetwear & Racing Centre Platform

**Tagline:** Built for the Racing Culture.  
Independent motorsport-inspired fashion e-commerce platform headquartered in Pakistan with international multi-currency support, an adapter-driven Formula 1 Racing Centre, and a WhatsApp Business Cloud API service layer.

## Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS v4 (`Anton`, `Hanken Grotesk`, `JetBrains Mono`), Lucide Icons.
- **Backend:** Express (`server.ts`), Zod server-side validation, scrypt password hashing, signed HTTP-only cookie sessions, RBAC (`CUSTOMER` / `ADMIN`), rate limiting, and audit logs.
- **Database:** SQLite (`pitlane.db` via `better-sqlite3`) with foreign keys, indexes, unique constraints, and atomic transactions (`db.transaction`) preventing overselling during concurrent checkouts.
- **WhatsApp Business Integration:** Server-side Graph API v21.0 client (`server/whatsapp.ts`) with masked credential storage, retry logic, HMAC webhook verification (`/api/whatsapp/webhook`), consent audit trail, and `wa.me` click-to-chat fallback when Cloud API credentials are unconfigured.
- **Formula 1 Racing Centre:** Adapter pattern (`server/f1Adapter.ts`) synchronizing live standings, race calendar, qualifying, and race results from the Jolpica / Ergast F1 API with server-side caching (`f1_cache`) and freshness timestamps.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Application runs at `http://localhost:3000`.

## Production Build

```bash
npm run lint
npm run build
NODE_ENV=production npm start
```

## Key API Endpoints

- `GET /api/bootstrap` — Storefront categories, collections, currencies, shipping zones, and announcement bar.
- `GET /api/products` & `GET /api/products/:slug` — Filtered product catalogue, variants, and reviews.
- `POST /api/checkout/quote` — Server-side shipping, coupon, tax, and multi-currency quote.
- `POST /api/checkout` — Transactional order creation with atomic variant stock decrement.
- `GET /api/orders/track/:orderNumber` — Verified order tracking.
- `POST /api/payments/webhook` — Idempotent payment verification webhook.
- `GET /api/racing/overview` — Cached F1 standings, calendar, results, and editorial articles.
- `GET/POST /api/whatsapp/webhook` — Meta WhatsApp Cloud API webhook verification & status handler.
- `GET/POST/PATCH/DELETE /api/admin/*` — Admin-protected analytics, inventory, orders, coupons, WhatsApp, and audit logs.

## Demo Accounts (Development Seed)

- **Customer:** `driver@pitlane.pk` / `PitlaneDriver!2026`
- **Admin:** `admin@pitlane.pk` / `PitlaneAdmin!2026`
