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
