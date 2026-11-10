# AnnaSeva: interview notes

> **How to use this page:** cover it, answer each heading out loud from memory, *then* compare. Anything you couldn't say without looking goes on your study list. Every number below was measured in this repo; quote only those.

## 30-second pitch

Restaurants throw away edible food every night while NGOs can't find it in time. **AnnaSeva** lets a donor post surplus food with a pickup window and location; nearby NGOs see it on a live map and claim it, and only one NGO can ever win a listing, even if several click at once. I built it full stack with React, Express, MongoDB and Socket.IO, with JWT auth, rate limiting and 23 automated tests.

## Architecture in five sentences

1. A React (Vite) single-page app on Vercel talks JSON over HTTPS to an Express 5 API on Render, which stores data in MongoDB Atlas.
2. Every protected request carries a JWT in `Authorization: Bearer`; middleware runs in order: `protect` (who are you?), `restrictTo` (right role?), `validate` (Zod) or `validateId`, then the controller.
3. Listings store location as GeoJSON `[lng, lat]` with a `2dsphere` index, so `/nearby` is one `$near` query filtered by `status: available` and `expiresAt > now`.
4. Claim, complete and cancel are each one atomic `findOneAndUpdate` whose filter is the business rule; ownership (`donor: req.user.id`) is part of the filter.
5. After each successful write the server emits Socket.IO events to rooms (`ngos`, `user:<id>`); clients update live and re-fetch from the API after a reconnect, because the database is the source of truth.

## Five hard problems (problem → what I tried → what worked → what I learned)

1. **Double-claim race condition.** Check-then-save let **18 of 20** simultaneous claims "win" one listing. Made the check and the change one `findOneAndUpdate` with `{ status: 'available', expiresAt > now }` in the filter → **1 × 200, 19 × 409** every run. *Lesson:* correctness under concurrency must live in the database, not in app code, and you can only see a race with a script that fires requests together (`Promise.all`), never by clicking.
2. **Longitude/latitude order.** GeoJSON is `[lng, lat]`, Leaflet and Google Maps want `lat, lng`. The API accepts `latitude`/`longitude` and builds GeoJSON on the server; the client swaps in exactly one helper (`listingLatLng`). Verified pins land on Pune, not in the ocean.
3. **Logging users out when the server was merely down.** On refresh, `AuthContext` cleared the session on *any* `/auth/me` failure, so a Render restart would log everyone out. Fixed: clear only on `401`; a network error keeps the session and the page shows "Cannot reach the server" with Try again.
4. **Duplicate socket handlers after navigation.** Every `socket.on` has a matching `socket.off` in the effect cleanup; verified after 5 page switches there was still exactly **1** handler per event.
5. **A test that couldn't fail.** The "expiry before preparation" test also broke other rules, so it would pass even with its own rule deleted. Rewrote it to break only that rule and assert the exact message; then deleted the rule on purpose and watched exactly that test go red. *Lesson:* a test you've never seen fail isn't trustworthy.

> Be ready to say how bugs 3–5 were found: during AI-assisted testing of each day's test table. That's a fine answer if you can explain the cause and the fix yourself.

## Five trade-offs I can defend

1. **Socket.IO vs polling vs SSE:** Socket.IO gives instant updates, rooms and reconnection; cost: its own CORS, listener cleanup, and a Redis adapter + sticky sessions with more than one server. Polling every 10 s would be simpler and is a valid fallback.
2. **JWT in `localStorage` vs `httpOnly` cookie:** simple across two domains; readable by any script on the page (XSS). React's escaping is the main defence; cookies + CSRF protection before real users.
3. **Expiry computed in queries vs a stored status + cron job:** can't go stale, no background job, history kept for the impact counter; cost: every "available" query must include `expiresAt > now`.
4. **Reference the donor by id vs embed the name:** one source of truth, renames never go stale; cost: a `populate` lookup on reads.
5. **In-memory rate limiting vs Redis:** right for one instance; resets on restart and wouldn't be shared across servers. Login is stricter (20 *failed* attempts / 15 min) to slow password guessing; `trust proxy = 1` so Render's proxy doesn't make everyone one IP.

## Five things I'd change with more time

1. NGO verification and an admin panel (anyone can register as an NGO today).
2. Show an approximate area until a listing is claimed (exact address is visible to every NGO now).
3. `httpOnly` cookie sessions with CSRF protection.
4. End-to-end browser tests (Playwright) and CI running `npm test` on every push.
5. Notifications (email/push) for new food nearby, and a cached `/api/stats`.

## Numbers I can quote honestly

- Roles: **2** (donor, NGO). Endpoints: **12** (incl. health). Socket events: **2**.
- Automated tests: **23** (`node:test`, no database needed).
- Race test: **20** simultaneous claims → broken version **18** winners; atomic version **1 × 200 + 19 × 409**.
- Index lab: **20,015** docs examined without the index vs **15** with it (13 ms vs 0 ms).
- Lighthouse (mobile): accessibility **100**, best practices **100** on public pages.
- Rate limits: **1000** requests / 15 min / IP overall; **20** failed logins / 15 min / IP.
- Search radius **0.5–50 km**; listings live at most **24 h**.

## The life of "NGO clicks Claim" (say it in under a minute)

Click → `window.confirm` → Axios `PATCH /listings/:id/claim` with the Bearer token → `apiLimiter` → `protect` verifies the JWT and that the user still exists → `restrictTo('ngo')` → `validateId` → atomic `findOneAndUpdate` with the guard filter → no match: `failTransition` checks existence → `404` or `409` → match: populate donor and claimer → `emitListingUpdated` (other NGOs: no `claimedBy`; donor and claimer: full) → `200` → the NGO's card disappears and a notice shows the pickup address; other NGOs' lists drop it; the donor sees "… claimed …" live.

## How I used AI (answer honestly, in your own words)

> "I used AI as a tutor and pair programmer: it explained concepts and wrote and tested code with me, and I didn't keep code I couldn't explain. It was also wrong sometimes, so I checked versions and docs, and I ran every day's test table myself. For example: [your own real example]. I can walk through any part line by line."

## Questions I would ask the interviewer

1. How does your team review code and ship changes?
2. What does a new junior developer's first month look like?
3. What's the hardest technical problem the team solved recently?

---

# Presentation drafts (Day 10, part E)

## Resume bullets (keep only what is true when you send it)

- Built and deployed **AnnaSeva**, a full-stack MERN app where donors post surplus food and nearby NGOs claim it, with role-based access, JWT authentication and live updates via Socket.IO. *[add the live link once deployed]*
- Prevented double claims with a single atomic MongoDB update, verified by a 20-request concurrency test (1 success, 19 conflicts), and used a `2dsphere` geospatial index for "within N km" searches on an interactive Leaflet map.
- Added server-side validation (Zod), rate limiting, security headers and 23 automated tests; reached Lighthouse accessibility 100 on mobile; documented 31 design decisions and trade-offs.

## LinkedIn post (draft)

I just finished a 10-day build of **AnnaSeva** (अन्नसेवा, "service through food"): a web app that connects restaurants with leftover food to nearby NGOs.

What it does: donors post surplus food; NGOs see it on a live map and claim it; only one NGO can win, even if two click at the same moment.

What I learned: my first version of "claim" let 18 out of 20 simultaneous requests win the same food. The fix was making the check and the update one atomic database operation, and I only saw the bug because I wrote a script that fires 20 requests at once.

Stack: React, Node/Express, MongoDB, Socket.IO, Leaflet. Live demo and code in the first comment. I'd love feedback.

## GitHub "About" box

- **Description:** Connecting surplus food from restaurants with nearby NGOs: live map, atomic claims, real-time updates (MERN + Socket.IO)
- **Website:** your Vercel URL
- **Topics:** `mern` `react` `nodejs` `express` `mongodb` `socket-io` `leaflet` `tailwindcss` `jwt` `geospatial`
