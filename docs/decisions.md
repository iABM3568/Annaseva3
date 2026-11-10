# AnnaSeva — Decision Log

One entry per meaningful technical decision: what, why, and what we gave up.

## D-001 — Canonical name is `annaseva` (Day 1)

- **Decision:** Use `AnnaSeva` / `annaseva` everywhere: repo, package (`annaseva-server`), databases (`annaseva_dev`, `annaseva`).
- **Why:** The project was renamed. One name avoids confusion in configs and connection strings.

## D-002 — Monorepo with `client/`, `server/`, `docs/` (Day 1)

- **Decision:** One Git repository with three top-level folders.
- **Why:** Frontend, backend and documentation are separate responsibilities, but for a solo project one repo keeps history and deploys simple.
- **Trade-off:** Two separate `package.json` files; you must `cd` into the right folder before running `npm`.

## D-003 — Create files only when implementing them (Day 1)

- **Decision:** The full file tree in `plan.md` Section 5 is the *target blueprint*. No empty placeholder files for auth, sockets, validators, etc.
- **Why:** Reduces cognitive overload; every file in the repo does something real.

## D-004 — ES Modules on the server (Day 1)

- **Decision:** `"type": "module"` in `server/package.json`; use `import`/`export`.
- **Why:** Modern standard, matches the React client, allows top-level `await` in `server.js`.
- **Gotcha:** Relative imports need the `.js` extension (`./app.js`).

## D-005 — Separate `app.js` (build) from `server.js` (start) (Day 1)

- **Decision:** `app.js` creates the Express app, middleware and routes, and exports it. `server.js` loads `.env`, connects to the DB, and calls `app.listen()`.
- **Why:** The app can be tested without opening a port, and Socket.IO can later attach to the HTTP server (Day 8).

## D-006 — Fail fast if MongoDB is unreachable (Day 1)

- **Decision:** `connectDB()` calls `process.exit(1)` on failure, and the server only starts listening *after* the DB connects.
- **Why:** An API that cannot reach its database would answer every data request with errors. Crashing loudly at startup is easier to diagnose.
- **Trade-off:** You cannot see `/api/health` until Atlas is configured. Revisit when deploying (a host may restart the process in a loop).

## D-007 — Separate dev and prod databases (Day 1)

- **Decision:** Local development uses `annaseva_dev`; production will use `annaseva`.
- **Why:** Experiments and seed scripts can never destroy live data.

## D-008 — CORS restricted to `CLIENT_URL` (Day 1)

- **Decision:** `cors({ origin: process.env.CLIENT_URL })`.
- **Why:** Browsers will only let our own front end read API responses.
- **Important:** CORS is a *browser* policy, **not** security or authentication. curl, Postman and Thunder Client ignore it entirely (verified on Day 1: curl with `Origin: http://evil.example` still received the response). Protecting data is the job of authentication (Day 2).

## D-009 — Atlas network access: current IP only (Day 1)

- **Decision:** Allow only the current IP for development. Use a strong, randomly generated database-user password.
- **Why:** Defence in depth. When deploying to Render (Day 5), `0.0.0.0/0` may be needed because the free tier has no fixed IP; treat that as a known, documented risk (mitigated by DB authentication), not a permanent default.

## D-010 — Token in `localStorage` vs `httpOnly` cookie (Day 2)

- **Options:** (a) `localStorage` + `Authorization: Bearer` header; (b) `httpOnly` cookie set by the server.
- **Choice:** (a) `localStorage`, for learning speed and simpler cross-origin setup (Vercel client ↔ Render API).
- **Trade-off:** Any injected script (XSS) can read `localStorage` and steal the token. `httpOnly` cookies hide it from scripts but bring CSRF concerns and cookie config (`SameSite`, `Secure`, CORS credentials). Mitigations: 7-day expiry, never render untrusted HTML, revisit before a real launch.

## D-011 — Password hashing with bcrypt (cost 12), JWT for sessions (Day 2)

- **Decision:** `bcryptjs` with cost 12 in a Mongoose `pre("save")` hook; stateless JWT `{ id, role }` signed with `JWT_SECRET`, valid 7 days.
- **Why:** Hashes can't be reversed, salt defeats precomputed tables, cost slows brute force. JWT means no session store on the server.
- **Trade-off:** A JWT can't be revoked before it expires (we do re-check that the user still exists in `protect`). bcrypt only uses the first 72 bytes of a password, so Zod caps passwords at 72.
- **Rule:** `JWT_SECRET` is a 96-hex-char random value in `.env` only. If it leaks, rotate it (every existing token becomes invalid).

## D-012 — Validation at the edge with Zod; explicit field picking (Day 2)

- **Decision:** `validate(schema)` middleware parses input, rejects with `400` and a list of `{ field, message }`, and passes only cleaned data as `req.valid`. Controllers never read `req.body` directly.
- **Why:** "Parse, don't trust." Zod strips unknown keys, and controllers list fields explicitly, so mass assignment (`"role": "admin"`, `"isAdmin": true`) is blocked twice.

## D-013 — Reference the donor by id instead of embedding (Day 3)

- **Decision:** A listing stores `donor: ObjectId` (ref `User`), not a copy of the donor's name/organisation.
- **Why:** One source of truth. If a donor renames their organisation, every listing is automatically correct.
- **Trade-off:** Reads need an extra lookup (`populate('donor', 'name organization')`). Embedding would be faster to read but can go stale. Revisit only if `populate` shows up as a measured bottleneck.
- **Security:** `donor` is always taken from `req.user.id` (the verified token), never from the request body.

## D-014 — Expiry is computed, not stored (Day 3)

- **Decision:** There is no `"expired"` status. Queries filter `expiresAt: { $gt: new Date() }` using the **server** clock; `/mine` returns a computed `isExpired` virtual.
- **Why:** A computed value can't go out of date, and we need no cron job to flip statuses. Expired listings stay in the database for history and stats.
- **Trade-off:** Every "available" query must remember the expiry filter. `.lean()` results don't include virtuals, so lean queries compute it themselves if they need it.

## D-015 — GeoJSON `[longitude, latitude]` built by the server; 2dsphere index (Day 3)

- **Decision:** The API accepts friendly `latitude`/`longitude`; the controller builds `{ type: 'Point', coordinates: [lng, lat] }`. A `2dsphere` index powers `$near` + `$maxDistance` (metres), nearest first, capped at 50 results.
- **Why:** Clients never have to know GeoJSON's longitude-first order, which removes the #1 geo bug at the edge.

## D-016 — Listing rules live in one constants file; every list is bounded (Day 3)

- **Decision:** `server/constants/listing.js` holds food types, statuses, length/quantity limits, the 24-hour rule and result limits. The Mongoose model and the Zod validator both import it. `/nearby` returns at most 50 rows; `/mine` and `/claimed` at most 100.
- **Why:** The same rule written twice eventually drifts. An unbounded result set can slow the server and the browser.
- **Also:** `preparedAt` may not be more than 5 minutes in the future (tolerance for device clocks).

## D-017 — Atomic claim instead of check-then-update (Day 4)

- **Decision:** Every state change (claim, complete, cancel) is ONE `findOneAndUpdate` whose **filter is the guard**: claim matches only `{ _id, status: 'available', expiresAt > now }`; complete only `{ _id, donor: me, status: 'claimed' }`; cancel only `{ _id, donor: me, status ∈ [available, claimed] }`.
- **Why:** Check-then-update (`findById` → check → `save`) leaves a gap where many requests pass the check. MongoDB applies a single-document update atomically, so only one request can still match.
- **Evidence (Lab 1, 20 simultaneous claims via `Promise.all`, 3 runs each):**
  - Broken check-then-update (50 ms gap): **18 × 200, 2 × 409** in every run, i.e. 18 NGOs "won" the same food.
  - Atomic `findOneAndUpdate`: **1 × 200, 19 × 409** in every run.
- **Scales:** The guarantee lives in the database, not in server memory, so it still holds with several server instances.
- **Note:** `findOneAndUpdate` skips schema validators by default. Safe here because the update values are fixed by us; add `{ runValidators: true }` if user input is ever written this way.

## D-018 — 400 / 403 / 404 / 409, and don't leak existence (Day 4)

- `400` malformed id (`validateId`, before the DB is touched) · `403` wrong role · `404` no such listing **or not yours** · `409` exists but its state forbids the action.
- On failure, `failTransition` checks existence **only within what the caller may see** (`{ _id, donor: me }` for donors). Donor B touching donor A's listing gets `404`, so B learns nothing about A's data.

## D-019 — Index evidence: measure before optimising (Day 4)

- **Lab 2** (`scripts/explain-lab.js`, 15 demo listings + 20,000 noise listings, query "listings of this donor"):

  | | Plan | Docs examined | Returned | Time |
  |---|---|---|---|---|
  | With `donor_1_createdAt_-1` | IXSCAN | 15 | 15 | 0 ms |
  | Without | COLLSCAN | 20,015 | 15 | 13 ms |

- **Lesson:** the index cut work by ~1,300×, but at this size the time difference is only milliseconds. Indexes matter as data grows; don't optimise what you haven't measured.

## D-020 — Deploy a skeleton early (Day 5)

- **Decision:** Deploy on Day 5 with only login/register: API on Render (`server/`), client on Vercel (`client/`, SPA rewrite in `vercel.json`), production data in Atlas database `annaseva` (dev stays `annaseva_dev`).
- **Why:** First-deploy problems (CORS origin, env vars, SPA 404s on refresh, cold starts, case-sensitive imports on Linux) are far easier to debug when the app is tiny. After this, every deploy is just `git push`.
- **Trade-off:** Render's free tier has no fixed IP, so Atlas allows `0.0.0.0/0`; the database is still protected by username/password and TLS (see D-009). Production uses its own new `JWT_SECRET`.

## D-021 — UI waits for the server instead of guessing results (Day 6)

- **Decision:** After "Mark picked up" or "Cancel", the dashboard replaces that one listing with the listing **the server returned** (pessimistic update); it never sets `status` itself.
- **Why:** The server is the source of truth. If the action was refused (409, 404) or something changed meanwhile, the screen can't show a lie.
- **Trade-off:** The UI updates after a round trip, not instantly. Fine at our scale; revisit (optimistic update + rollback) only if it feels slow.
- **Also:** The form converts `datetime-local` (local time, no zone) to UTC with `new Date(value).toISOString()`; we store and send UTC and display in local time. "Expired" is derived on the client from `expiresAt`, never stored.

## D-022 — An unreachable server must not log the user out (Day 6)

- **Bug found in testing:** On page load, `AuthContext` cleared the session on *any* `/auth/me` failure. With the API down (or Render restarting/redeploying), refreshing logged users out.
- **Decision:** Clear the session only on `401` (token expired or tampered). On a network error, keep the saved user; each page shows "Cannot reach the server" with **Try again**.
- **Verified:** API down → dashboard error + retry, still logged in; API back → Try again loads data; tampered token → still logged out.
