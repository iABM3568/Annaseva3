# AnnaSeva

> Surplus food, to the people who need it, before it spoils.

*anna* (अन्न) means food or grain, and *seva* (सेवा) means selfless service: **AnnaSeva** is "service through food".

**Live demo:** coming soon · **2-minute video:** coming soon · [Code](https://github.com/iABM3568/Annaseva3)

> The live demo will run on free hosting. If it has been idle, the server can take about a minute to wake up.

![AnnaSeva: an NGO's live map of nearby food](docs/images/ngo-map.jpg)

## The problem

Restaurants, caterers and hostels throw away edible food every night, while NGOs that feed people struggle to find surplus food in time. The food exists and so does the need; what's missing is a fast way for the two to find each other before the food spoils.

## What it does

- **Donors** (restaurants, caterers, hostels) post surplus food: what it is, how many meals, a pickup address, their location, and how long it stays good (at most 24 hours).
- **NGOs** see available food near them on a **map and in a list**, nearest first, updated **live**, and claim it.
- **Only one NGO can claim a listing**, even if several click at the same instant: the claim is a single atomic database operation.
- Donors mark pickups as done, and a public counter shows **meals rescued**.
- Expired food never appears to NGOs, and every rule is enforced on the server, not just hidden in the UI.

## Screenshots

| Landing page and impact counter | Donor dashboard | A listing claimed live |
|---|---|---|
| ![Landing page with the meals-rescued counter](docs/images/landing.jpg) | ![Donor dashboard with active listings](docs/images/donor.jpg) | ![A claimed listing with "Mark picked up"](docs/images/donor-claimed.jpg) |

| NGO map (desktop) | NGO map (phone, 390 px) |
|---|---|
| ![NGO map with pins and search radius](docs/images/ngo-map.jpg) | <img src="docs/images/mobile.png" alt="NGO map on a phone-width screen" width="260"> |

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Front end | React 19, Vite, React Router, Tailwind CSS, Leaflet (react-leaflet) | Fast dev loop, component reuse, mobile-first styling, free OpenStreetMap tiles |
| Back end | Node.js, Express 5 | Same language on both sides; Express 5 forwards async errors to one error handler |
| Database | MongoDB Atlas, Mongoose | Built-in geospatial queries (`2dsphere` index, `$near`) for "food within N km" |
| Real time | Socket.IO | Live updates with rooms, authenticated connections and automatic reconnection |
| Auth and security | JWT, bcrypt, Zod, helmet, express-rate-limit | Signed sessions, hashed passwords, server-side validation, safe headers, brute-force protection |
| Testing | `node:test` (built in), concurrency and index-lab scripts | No extra test framework; tests run without a database |
| Hosting | Vercel (client), Render (API), MongoDB Atlas (data) | Free tiers |

## Architecture

```mermaid
flowchart LR
  Donor["Donor browser<br/>(React on Vercel)"] -->|"HTTPS + JSON<br/>Bearer JWT"| API["Express API + Socket.IO<br/>(Render)"]
  NGO["NGO browser<br/>(React on Vercel)"] -->|"HTTPS + JSON<br/>Bearer JWT"| API
  API -->|"live events<br/>(rooms: ngos, user:id)"| Donor
  API -->|"live events"| NGO
  API --> DB[("MongoDB Atlas<br/>2dsphere index")]
```

**What happens when an NGO clicks Claim:** React sends `PATCH /api/listings/:id/claim` through an Axios instance that attaches the JWT. On the server, `protect` verifies the token, `restrictTo('ngo')` checks the role and `validateId` rejects malformed ids. The controller runs **one** `findOneAndUpdate` whose filter is the rule itself, `{ _id, status: 'available', expiresAt > now }`. If it matches, the listing becomes `claimed` and the API answers `200`; if another NGO got there first, nothing matches and the API answers `409`. Only **after** the database write succeeds does the server emit `listing:updated`: other NGOs' screens drop the listing (without learning who claimed it), and the donor's dashboard shows "Helping Hands Trust claimed …" instantly.

## Interesting engineering problems

1. **Double claims (a race condition).** The obvious code reads the listing, checks it's available, then saves it as claimed. Between the check and the save, other requests can pass the same check. A script that fires **20 claims at the same instant** showed **18 "winners"** for one listing. Making the check and the change a single atomic `findOneAndUpdate` gives **exactly 1 × `200` and 19 × `409`**, every run, and because the guarantee lives in the database it holds even with several servers.
2. **Geospatial search.** Locations are GeoJSON points, **`[longitude, latitude]`** (the opposite of how maps usually say it), with a `2dsphere` index so `$near` + `$maxDistance` (in metres) returns "available food within 5 km, nearest first". The API accepts friendly `latitude`/`longitude` and the server builds the GeoJSON; on the client, **one** helper swaps to Leaflet's `[lat, lng]`.
3. **Real-time without lying.** Sockets authenticate with the same JWT during the handshake and join rooms (`ngos`, `user:<id>`). Events are sent only after the database write, other NGOs get a version **without `claimedBy`** (data minimisation), and every page **re-fetches from the API after a reconnect**, because events missed while offline are gone. The database, not the events, is the source of truth.
4. **Measuring instead of guessing.** With 20,000 extra listings, `explain()` showed the donor index turning a full collection scan (**20,015 documents examined**) into an index scan (**15 examined**). At this size the time saved was only ~13 ms: indexes matter as data grows, so measure before optimising.

## Decisions and trade-offs

| Decision | Alternatives | Why I chose this | Cost |
|---|---|---|---|
| Atomic `findOneAndUpdate` for claim/complete/cancel | Read, check, then save | The filter *is* the guard; proven with a 20-request race test | Must work out *why* nothing matched (404 vs 409) with a second query |
| Socket.IO for live updates | 10-second polling, Server-Sent Events | Instant updates, rooms for privacy, reconnection built in | Own CORS setting, listener cleanup, and a Redis adapter if there are ever two servers |
| "Expired" computed from `expiresAt` in every query | A stored `expired` status updated by a cron job | Can't go stale, no background job, history kept for the impact counter | Every "available" query must remember the expiry filter |
| JWT in `localStorage` + `Authorization: Bearer` | `httpOnly` cookie | Simple across two domains (Vercel ↔ Render) | Readable by any script on the page (XSS); React's escaping is the main defence |
| In-memory rate limits (strict on failed logins) | Redis-backed counters | Right for one server; slows password guessing | Counters reset on restart and wouldn't be shared between servers |
| Donor stored as a reference (`ObjectId` + `populate`) | Embedding the donor's name | One source of truth; renames never go stale | An extra lookup when reading |

The full log, 31 decisions with the reasoning and how each was verified, is in [`docs/decisions.md`](docs/decisions.md). Capacity thinking ("what breaks first at 100×?") is in [`docs/scaling-notes.md`](docs/scaling-notes.md).

## Run it locally

**Prerequisites:** Node.js **22 or newer**, Git, and a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster with:
- a **database user** (Atlas › Database Access) whose password uses only letters and numbers (special characters need URL-encoding),
- your current IP allowed (Atlas › Network Access),
- the connection string from Atlas › Connect › Drivers.

```bash
git clone https://github.com/iABM3568/Annaseva3.git
cd Annaseva3

# 1) Server (terminal 1)
cd server
npm install
cp .env.example .env    # then edit .env: set MONGO_URI and JWT_SECRET (table below)
npm run dev             # http://localhost:5000  (check http://localhost:5000/api/health)

# 2) Client (terminal 2, from the repo root)
cd client
npm install
cp .env.example .env    # the defaults already point at localhost:5000
npm run dev             # open http://localhost:5173

# 3) Optional: demo data (only runs on a database whose name ends in _dev)
cd server
node scripts/seed.js 15 # prints two demo logins (donor and NGO)
```

Keep the database name in `MONGO_URI` ending in **`_dev`** (for example `annaseva_dev`): the seed and cleanup scripts refuse any other database unless you pass `--force`.

To make a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Environment variables

| File | Variable | Example | Meaning |
|---|---|---|---|
| `server/.env` | `PORT` | `5000` | Port the API listens on (Render sets its own) |
| `server/.env` | `MONGO_URI` | `mongodb+srv://USER:PASS@cluster.mongodb.net/annaseva_dev?retryWrites=true&w=majority` | Atlas connection string; the path is the database name |
| `server/.env` | `JWT_SECRET` | a 96-character random hex string | Signs login tokens; use a different one in production |
| `server/.env` | `CLIENT_URL` | `http://localhost:5173` | The exact front-end origin allowed by CORS and Socket.IO (no trailing slash) |
| `server/.env` | `NODE_ENV` | `development` | `production` on Render |
| `server/.env` | `RATE_LIMIT_MAX` | `1000` | Optional: general requests per 15 minutes per IP |
| `server/.env` | `DEMO_PASSWORD` | a long private passphrase | Optional: password for seeded demo accounts (default `Demo@12345`, dev only) |
| `client/.env` | `VITE_API_URL` | `http://localhost:5000/api` | Where the API lives (baked into the build: redeploy after changing) |
| `client/.env` | `VITE_SOCKET_URL` | `http://localhost:5000` | Where Socket.IO connects (the API origin, **no** `/api`) |

`VITE_` variables end up in the browser bundle, so they are public. Never put a secret in them.

## Tests

```bash
cd server && npm test     # 23 tests, no database needed
```

The suite covers the validation rules (blank coordinates must not become `0`, the 24-hour expiry limit, unknown fields stripped, no self-promotion to admin) and the API's behaviour over real HTTP: security headers, JSON 404s, `400` for malformed JSON, `401` without a token, `413` for oversized bodies.

Two scripts test things a unit test can't:

```bash
node scripts/race-test.js <listingId> <ngoToken>   # 20 simultaneous claims: expects exactly one 200
node scripts/explain-lab.js                         # index vs no index, with explain() numbers (dev DB only)
```

## API overview

| Method | URL | Who | Purpose |
|---|---|---|---|
| GET | `/api/health` | anyone | Health check (not rate-limited) |
| POST | `/api/auth/register`, `/api/auth/login` | anyone | Create an account / log in; returns a JWT (strict rate limit on failures) |
| GET | `/api/auth/me` | logged in | Who am I? |
| POST | `/api/listings` | donor | Post surplus food |
| GET | `/api/listings/mine` | donor | My listings, newest first |
| GET | `/api/listings/nearby?lat=&lng=&radiusKm=` | NGO | Available, unexpired listings within 0.5–50 km, nearest first |
| GET | `/api/listings/claimed` | NGO | Listings I have claimed |
| PATCH | `/api/listings/:id/claim` | NGO | Atomic claim: `200`, or `409` if someone was faster or it expired |
| PATCH | `/api/listings/:id/complete` | owning donor | Mark a claimed listing as picked up |
| PATCH | `/api/listings/:id/cancel` | owning donor | Cancel an available or claimed listing |
| GET | `/api/stats` | anyone | Meals rescued and number of pickups |

Socket events: `listing:new` (to NGOs) and `listing:updated` (to NGOs without `claimedBy`; full version to the donor and the claimer).

## Roadmap

- [ ] Notifications (email or push) when food is posted nearby
- [ ] NGO verification and an admin panel (needed before real-world use)
- [ ] Show only an approximate area until a listing is claimed (privacy)
- [ ] End-to-end browser tests (Playwright) and CI on every push
- [ ] AI: draft a listing from a photo of the food, always confirmed by the donor

## Project docs

- [`docs/decisions.md`](docs/decisions.md): every design decision, the alternatives and how it was verified
- [`docs/scaling-notes.md`](docs/scaling-notes.md): what breaks first, and the scaling steps in order
- [`docs/plan.md`](docs/plan.md): the 10-day build-and-learn plan this project followed
- [`docs/journal.md`](docs/journal.md): daily notes and lab results

## License

[MIT](LICENSE)
