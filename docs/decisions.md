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
