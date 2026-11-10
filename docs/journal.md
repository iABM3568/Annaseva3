# AnnaSeva — Learning Journal

## Day 1: Foundations, Git and the First Server   (2026-11-09)

**Hours worked:**

**What I built:**
- Repo skeleton: `client/`, `server/`, `docs/`, `.gitignore`, `README.md`
- Express server: `server.js`, `app.js`, `config/db.js`, `GET /api/health`
- `.env` / `.env.example`, MongoDB Atlas connection
- `docs/requirements.md`, `docs/decisions.md`

**What confused me:**

**Errors I hit and how I fixed them:**
- Wrong / placeholder `MONGO_URI` → `MongoDB connection failed: querySrv ENOTFOUND ...` and exit code 1. Fix:

**AI log:** prompt -> what I changed -> what I learned

### Self-ask answers (write them WITHOUT looking at the code)

1. What is the difference between a client and a server? Use the restaurant analogy.
   >

2. What does `GET` mean, and how is it different from `POST`?
   >

3. What's the difference between status `404`, `401` and `500`?
   >

4. Why is `.env` in `.gitignore`, and why do we commit `.env.example`?
   >

5. What does `app.use(express.json())` do? What would break if you removed it?
   >

6. Why does `import 'dotenv/config'` have to be the first import?
   >

7. What is a database *user* in Atlas, and how is it different from your Atlas account?
   >

8. Why do we use a separate database name for development?
   >

9. What is `node_modules`, and why don't we commit it?
   >

> Precision notes to check your answers against *after* writing them:
> - A GET should not change server-side data (it isn't technically forbidden from having a body).
> - 401 = authentication missing or invalid, not just "never logged in". 500 = an unexpected server-side error, not necessarily a full crash.
> - CORS does not stop Postman, curl or Thunder Client; it's a browser policy.

### Explain-back (3 sentences, no code)

Client → Server → Database:
>

Purpose of each backend file (`server.js`, `app.js`, `config/db.js`, `.env`, `.env.example`):
>

**Tomorrow's first task:**

---

## Day 2: Users and Authentication   (2026-11-09)

**Hours worked:**

**What I built:**
- `User` model (bcrypt hash in `pre("save")`, `select: false`, `toJSON` strips password)
- Zod schemas + `validate` middleware (`req.valid`)
- `generateToken` (JWT `{ id, role }`, 7 days)
- `register`, `login`, `getMe` controllers; `/api/auth` routes
- `protect` / `restrictTo` middleware; JSON `notFound` + `errorHandler`
- Request collection: `docs/api/AnnaSeva.postman_collection.json`

**What confused me:**

**Errors I hit and how I fixed them:**

**AI log:** prompt -> what I changed -> what I learned

### Self-ask answers (write them WITHOUT looking at the code)

1. What is the difference between authentication and authorization? Give an AnnaSeva example of each.
   >

2. Why do we *hash* passwords instead of encrypting them?
   >

3. What are the three parts of a JWT? Which part is secret?
   >

4. Can a user edit their own token's role to `admin`? Why or why not?
   >

5. What is `JWT_SECRET` for, and what happens if it leaks?
   >

6. What's the difference between `401` and `403`?
   >

7. Why does login return the same error for "wrong email" and "wrong password"?
   >

8. What does `select: false` do on the password field, and where do we override it?
   >

9. Why does `restrictTo` have to come after `protect`?
   >

10. Why validate on the server when the form will also validate?
    >

11. What is *mass assignment*, and how did we prevent it?
    >

12. What's the trade-off of storing the token in `localStorage`?
    >

### Explain-back (say it aloud, then write 3 sentences)

Register → Login → `protect` → `restrictTo`:
>

**Tomorrow's first task:**

---

## Day 4: The Claim System and the System-Design Lab   (2026-11-10)

### Lab 1: race condition (20 simultaneous claims, `node scripts/race-test.js <id> <ngoToken>`)

| Version | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Broken (check-then-update) | 18 × 200, 2 × 409 | 18 × 200, 2 × 409 | 18 × 200, 2 × 409 |
| Atomic (`findOneAndUpdate`) | 1 × 200, 19 × 409 ✅ | 1 × 200, 19 × 409 ✅ | 1 × 200, 19 × 409 ✅ |

### Lab 2: index (`node scripts/explain-lab.js`)

| | Plan | Docs examined | Time |
|---|---|---|---|
| With donor index | IXSCAN | 15 | 0 ms |
| Without | COLLSCAN | 20,015 | 13 ms |

### What I learned (my own words)
>

### Self-ask answers
>

### Explain-back (atomic claim, 3 sentences)
>

**Tomorrow's first task:**

---

## Day 9: Hardening, Polish and Buffer   (2026-11-10)

### Buffer list: unfinished or shaky from Days 1 to 8

| # | Item | From | Status |
|---|---|---|---|
| 1 | **First deploy not confirmed** (Render API + Vercel client), so no Day 5–8 test has run on the live site | Day 5 | ⏳ Mine to do: needed for the live smoke test and `trust proxy` check |
| 2 | `VITE_SOCKET_URL` on Vercel + redeploy | Day 8 | ⏳ Mine to do (after #1) |
| 3 | Homework written by Claude, not me: `Register.jsx`, the `NewListing` form fields | Days 5–6 | ⏳ Rewrite from memory and compare |
| 4 | "Please share your pickup location first" stays visible after location is shared | Day 6 | ✅ Fixed today (polish) |
| 5 | White text on `green-600` fails contrast; small (≈32 px) buttons | Days 5–7 | ✅ Fixed today (polish) |
| 6 | Self-ask answers and explain-backs for Days 2–8 not written | Days 2–8 | ⏳ Mine to do |
| 7 | Real two-window test (normal + incognito) of claim conflict and live updates | Days 7–8 | ⏳ Mine to do (verified by scripts, not by hand) |

### Day 9 results (local)

| # | Test | Result |
|---|---|---|
| 1 | `npm test` | ✅ 23 passing, 0 failing |
| 2 | Break a rule on purpose | ✅ `MAX_HOURS_AHEAD` 24→48, removing `blankIsMissing`, deleting the expiry-after-preparation rule: each made exactly the matching test fail; undo → 23 pass. (The plan's "expiry before preparation" test also tripped other rules, so it would have passed even with its rule deleted; rewritten to break only that rule.) |
| 3 | `rate-limit-check.js` | ✅ 20 × 401 then 5 × 429 |
| 4 | 429 body + React form | ✅ "Too many requests. Please wait a few minutes and try again." shown on the login page |
| 5 | Restart → correct login | ✅ |
| 6 | 20 kb body | ✅ 413 "Request body too large" |
| 7 | `{ not json` | ✅ 400 |
| 8 | `/api/stats` fresh | ✅ `{ mealsRescued: 0, pickups: 0 }` |
| 9 | Complete a 20-meal listing | ✅ `{ mealsRescued: 20, pickups: 1 }`; landing shows "20 meals rescued across 1 pickup" |
| 10 | Landing with API off | ✅ page renders, counter hidden, no error banner |
| 11 | Lighthouse (mobile) | ✅ Accessibility 100, Best practices 100 on `/`, `/login`, `/register` (logged-in pages checked by hand: contrast, 44 px targets, 16 px inputs, no sideways scroll at 360/390 px) |
| 12 | Keyboard only: log in, post, claim | ✅ visible 3 px blue focus outline; found and fixed: 15 map pins were Tab stops before the first Claim (22 → 7 stops) |
| 13 | Live smoke test | ⏳ needs the deploy |
| 14 | `trust proxy` check | ⏳ needs the deploy |
| — | Race test on final code | ✅ 1 × 200, 19 × 409 |

**Top polish fixes:** white-on-green contrast (`green-600` → `green-700`); 44 px tap targets everywhere (buttons, links, radius and food-type selects); visible keyboard focus; the "share your location first" hint now disappears once a location is shared; map `h-72 sm:h-96`; radius select 16 px text (no iPhone zoom); map pins out of the Tab order; "1 pickup" singular; AnnaSeva favicon.

### What I learned (my own words)
>

### Explain-back (rate limiting, trust proxy, stats pipeline)
>

---

## Day 10: Docs, Demo and Interview Prep   (2026-11-10)

### Done today

- Repo clean-up: no debug logs or TODOs left (only "Server running" / "MongoDB connected"); complete `.env.example` files; only the two `.env.example` files tracked; Node `>=22` in both `package.json`s; MIT `LICENSE`.
- `README.md`: problem, features, 5 screenshots (desktop + 390 px phone), stack, Mermaid architecture diagram, the "NGO clicks Claim" flow, engineering problems, decisions table, run-locally steps, env table, tests, API overview, roadmap.
- **Fresh-clone test:** cloned into an empty folder and followed only the README: server healthy, client served, seed printed demo logins, 23/23 tests passed, demo NGO found 15 listings. Found one README bug (step 3 said `cd server` while the terminal was inside `client/`); fixed.
- `scripts/cleanup-demo.js`: tested on dev after seeding with a private `DEMO_PASSWORD` → "Deleted 12 listings and 2 demo users", 0 demo users left.
- `docs/interview-notes.md`: pitch, architecture, 5 hard problems, 5 trade-offs, honest numbers, resume bullets, LinkedIn draft, GitHub About text.

### Still to do (needs me / the live site)

- [ ] Deploy (Render + Vercel + `VITE_SOCKET_URL`), then add the live link to the README
- [ ] Seed production with a private password **30 minutes before** a demo; run `cleanup-demo.js --force` after
- [ ] Record the 2-minute demo video (Appendix D script), upload, link it in the README
- [ ] GitHub About box + pin the repo; tag `v1.0.0` once the README has the live link
- [ ] Mock interview: 12 questions out loud, recorded, weak answers on my study list

### Progress tracker (Appendix H)

| Day | Theme | Built and committed | Tests pass | Explain-back done | Notes / blockers |
|---|---|:-:|:-:|:-:|---|
| 1 | Foundations, Git, first server | ✅ | ✅ | [ ] | |
| 2 | Users and authentication | ✅ | ✅ | [ ] | |
| 3 | Listings API | ✅ | ✅ 21/21 | [ ] | |
| 4 | Claim system and system-design lab | ✅ | ✅ race 1×200 / 19×409 | [ ] | |
| 5 | React, login screens, first deploy | ✅ local | ✅ 10/10 local | [ ] | Deploy not done yet |
| 6 | Donor experience | ✅ | ✅ 13/13 local | [ ] | Fixed: logout on network error |
| 7 | NGO experience (map and claim) | ✅ | ✅ 13/13 local | [ ] | Fixed: no map when location denied |
| 8 | Real-time updates | ✅ | ✅ 13/13 local | [ ] | Needs `VITE_SOCKET_URL` on Vercel |
| 9 | Hardening, polish, buffer | ✅ | ✅ 23 tests, 12/14 rows | [ ] | Live smoke + trust proxy pending |
| 10 | Docs, demo, interview prep | ✅ docs | ✅ fresh clone | [ ] | Video, prod seed, tag pending |

### Retrospective (my own words)

**What was hardest?**
>

**What surprised me?**
>

**Which concept can I now explain well?**
>

**Which one am I still shaky on?**
>

**What would I do differently if I started again?**
>

**My next step (Appendix E or a new project):**
>
