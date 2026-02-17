# Architecture Overview

**Date:** 2026-02-13
**Scope:** Frontend (`src/`) & Backend (`worker/`)

## 1. High-Level Topology

- **Frontend:** SPA (React 19 + Vite) hosted on Cloudflare Pages.
- **Backend:** Serverless (Cloudflare Workers) with D1 (SQLite) and KV.
- **Protocol:** REST API over HTTP/2.
- **Auth:** Custom HMAC-SHA256 validation of Telegram `initData`.

## 2. Key Findings

### 🔴 Critical Architectural Issues

1. **Monolithic Worker Handler (`worker.ts`)**
    - The `fetch` handler exceeds 400 lines.
    - Routing is handled via `if/else` statements manually matching `path` and `method`.
    - **Risk:** High maintenance cost, prone to errors when adding new routes.
    - **Recommendation:** Adopt a router (e.g., `itty-router` or `hono`) to split handlers into separate files.

2. **Raw SQL Queries**
    - Backend uses `env.DB.prepare('SELECT ...')`.
    - **Risk:** No build-time type safety for query results. Refactoring DB schema requires manual grep/replace of SQL strings.
    - **Recommendation:** Use a lightweight query builder like `Kysely` or `drizzle-orm` for D1.

3. **Frontend State Scalability**
    - State is decentralized across custom hooks (`useTasks`, `useHabits`) using `useState`/`useEffect`.
    - **Risk:** Potential prop drilling or duplicate data fetching if components grow.
    - **Recommendation:** Consider `TanStack Query` (React Query) for caching and server state management, or `Zustand` for client state if needed.

### 🟠 Moderate Issues

1. **Hardcoded API URL Logic**
    - `src/lib/api.ts` relies on `import.meta.env.VITE_API_URL`.
    - Good practice, but ensures tight coupling to a specific deployment structure.

2. **DTO/Type Duplication**
    - Types are manually defined in `src/types/index.ts` and `src/lib/api.ts`.
    - Backend (Go/TS) and Frontend (TS) should ideally share types via a shared package or workspace.

## 3. Tech Stack Review

| Component | Current Choice | Verdict |
|-----------|----------------|---------|
| **Framework** | React 19 + Vite | ✅ Excellent (Modern, Fast) |
| **Styling** | Tailwind v4 | ✅ Excellent (Future-proof) |
| **Backend** | Cloudflare Workers | ✅ Excellent (Low latency, cheap) |
| **Database** | D1 (SQLite) | ✅ Good for read-heavy, low-write apps |
| **ORM** | Raw SQL | ❌ Poor (Productivity bottleneck) |
| **Routing** | Manual if/else | ❌ Poor (Maintainability bottleneck) |

## 4. Recommendations

1. **Refactor Worker:** Split `worker.ts` into `routes/tasks.ts`, `routes/habits.ts` using a router.
2. **Introduce Query Builder:** Replace raw SQL with `Kysely`.
3. **Frontend Caching:** Implement `TanStack Query` to replace manual `useEffect` fetching.
