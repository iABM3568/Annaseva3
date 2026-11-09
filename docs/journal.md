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
