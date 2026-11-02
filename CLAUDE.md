# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this app is

"시니어라이프" (SeniorLife) — a Korean elder-care facility directory and consultation-booking app. Users browse/search facilities (실버타운, 요양원, 요양병원, 주야간보호, 방문 돌봄), view facility detail pages, and (once logged in) submit consultation requests. UI copy and in-code comments are written in Korean; match that convention when editing existing screens.

Three user roles: `USER` (consumer, default), `BUSINESS_OWNER` (facility operator — self-signs-up via `/business-signup`, manages only their own organization's facilities, which start `PENDING` and need admin approval before appearing in public search), `ADMIN` (platform operator — approves/rejects `PENDING` facilities, manages everything). This is phase 1 of a self-service facility marketplace (operators register their own listings instead of admin entering them manually) — see `backend_reference.md`/memory for the planned phase 2 (subscription billing) this is building toward.

## Backend

There is no backend code in this repo. The app talks to a separate Spring Boot REST API (see `env.example` for its env vars: MySQL, JWT auth). Base URL is set in `src/config/api.ts`:
- Web: `http://localhost:8080`
- Native: `http://10.0.2.2:8080` (Android emulator loopback — on a physical device, swap this for the machine's LAN IP)

When adding new screens that need data, add the endpoint call via `apiFetch` (see below) rather than `fetch` directly.

## Auth & API architecture

- `src/lib/api.ts` — `apiFetch<T>(path, options)` is the single entry point for all backend calls. It attaches the bearer token automatically, normalizes server error bodies into `ApiError` (with Korean default messages per status code), and treats network failures as `status: 0`. On a `401` from an authenticated request it invokes a module-level `unauthorizedHandler` instead of handling logout itself.
- `src/lib/storage.ts` — token persistence, split by platform: `expo-secure-store` (Keychain/Keystore) on native, `localStorage` on web.
- `src/context/AuthContext.tsx` — owns `user`/`loading` state, wires its `logout` into `api.ts`'s `unauthorizedHandler` (so an expired/invalid token anywhere triggers auto-logout), and restores session on launch by checking for a stored token and calling `/api/auth/me`. Consume via `useAuth()`; it throws if used outside `AuthProvider`.
- `src/app/_layout.tsx` — `AuthGate` is the route guard: unauthenticated users hitting `/consultations`, `/reservations`, or `/admin` get redirected to `/login`; authenticated users landing on `/login` or `/signup` get redirected to `/`. Facility browsing (`/`, `/facilities/[id]`) is intentionally open to logged-out users. When adding a new route that needs login, extend the `needsLogin` check here rather than guarding inside the screen.
- `src/app/admin/_layout.tsx` — a second gate nested under the root one: redirects to `/` unless `user.role === "ADMIN"`. The root gate only handles the logged-out case; role-based access is admin-layout-only, so an authenticated non-admin user is bounced here, not at the root.
- `src/app/business/_layout.tsx` — same pattern as the admin gate, but for `user.role === "BUSINESS_OWNER"`.

## Routing

Stack-based navigation (`<Stack screenOptions={{ headerShown: false }} />` in `_layout.tsx`) — there is no tab bar wired up.

Routes live under `src/app/`: `index.tsx` (facility search/home), `login.tsx`, `signup.tsx`, `business-signup.tsx` (사업자 가입 — creates a `BUSINESS_OWNER` account + their organization in one call), `facilities/[id].tsx` (detail — photo gallery + consultation/reservation buttons), `consultations/` (`index.tsx` list, `new.tsx` booking form, `success.tsx`), `reservations/` (same shape as `consultations/`, for 방문예약), `admin/` (ADMIN-only: `index.tsx` menu, `facilities/` list+create+edit-with-photo-management incl. PENDING approve/reject, `reservations/index.tsx` and `consultations/index.tsx` — all-user admin views with status-change actions), `business/` (BUSINESS_OWNER-only: `index.tsx` list of just their own facilities, `requests.tsx` consultation/reservation requests for their own facilities, `new.tsx`/`[id].tsx` create+edit+photos — no status-change controls, since approval is admin-only; calls `/api/business/**`, never `/api/admin/**`).

**Expo Router typed-routes gotcha**: `.expo/types/router.d.ts` is generated live by the Metro dev server and has a known bug where a folder's `index.tsx` added *while Metro is already running* (not present at a cold start) gets typed as `/folder/index` instead of being collapsed to the real runtime route `/folder` — the `/index` form 404s at runtime even though it satisfies `tsc`. Before trusting a generated route type for a recently-added route, verify the real path by curling the Metro dev server (`curl -o /dev/null -w "%{http_code}" http://localhost:8081/<path>` — 200 vs 404) rather than changing the href to whatever the stale type claims. If `tsc` still complains about the real (correct) path, use the documented escape hatch: `import type { Href } from "expo-router"; router.push("/the/real/path" as Href)`.

## Path aliases

`@/*` → `src/*`, `@/assets/*` → `assets/*` (configured in `tsconfig.json`).

## Git commit workflow

When committing (in this repo or the backend repo at `eclipse-workspace/demo`), don't narrate or print the commit's diff/content in the terminal — just stage, commit, and push, then report tersely (e.g. one line: what changed, commit hash). The user reads diffs in their own git client/IDE, not in chat.
