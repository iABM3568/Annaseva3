# AnnaSeva client

React (Vite) front end for AnnaSeva: Tailwind CSS, React Router, Axios.

```bash
cp .env.example .env   # VITE_API_URL points at the API (default http://localhost:5000/api)
npm install
npm run dev            # http://localhost:5173 (the server's CLIENT_URL must match exactly)
npm run build          # production build into dist/ (what Vercel serves)
```

`VITE_` variables are baked into the build and are **public**: never put secrets in them.
Changing one on Vercel requires a redeploy.
