# AnnaSeva: scaling notes (Day 9 paper design review)

Current shape: one Render free instance (Node + Express + Socket.IO), one Atlas free (M0) cluster, a static React build on Vercel's CDN.

| Question | Answer |
|---|---|
| **What breaks first at 100× traffic?** | The free Atlas cluster's throttle (roughly 100 operations/second): every `/nearby`, `/stats` and claim is a query. Next, the single Node process on a free Render instance (shared CPU, ~512 MB RAM, sleeps when idle), which also holds every open socket. The static client on Vercel's CDN is the last thing to break. |
| **Rate-limit counters with two servers?** | Each process counts on its own, so a client gets up to double the budget and limits become unpredictable behind a load balancer. Move counters to a shared store (Redis) via a rate-limit store adapter. |
| **Socket.IO with two servers?** | An event emitted on server A only reaches sockets connected to A. Fix: the Socket.IO Redis adapter (servers share events through Redis) plus sticky sessions for the HTTP long-polling handshake. The atomic claim keeps working regardless: its guarantee lives in MongoDB (D-017, D-027). |
| **Which endpoint could use a cache?** | `/api/stats`: the same answer for everyone. A 30–60 s cache cuts it to one query per window; trade-off: the counter can be that much behind. Possibly the auth `/me` lookup too (short TTL). |
| **Which query is hardest to cache?** | `/listings/nearby`: every NGO's location and radius differ, and results change whenever anything is posted or claimed. Rounding coordinates to a grid cell could make it cacheable, at the cost of precision and staleness. |
| **Single points of failure?** | One Render instance (a crash or a sleep = API and sockets down), one Atlas cluster with no SLA on the free tier, one region. Also the OSM public tile server (fine for a demo, not for production volume). |
| **What would I monitor?** | Uptime of `/api/health` (external pinger); 5xx error rate; count of 429s (attack or a too-low limit); DB latency and Atlas throttling alerts; number of connected sockets; time from "posted" to "claimed". |
| **Next scaling step I'd actually take?** | In order: (1) check indexes with `explain()` (Day 4 lab) for every hot query; (2) cache `/stats`; (3) paid always-on instance + paid Atlas tier; (4) only then more instances, with Redis for both rate-limit counters and the Socket.IO adapter. |

## What we measured (not guessed)

- Day 4 index lab: with `donor_1_createdAt_-1` → IXSCAN, 15 docs examined, 0 ms; without → COLLSCAN, 20,015 docs, 13 ms. At small scale an index barely changes speed: measure before optimising.
- Day 4/9 race test: 20 simultaneous claims → exactly 1 × 200 and 19 × 409, against the final code.
