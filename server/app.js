import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/error.js";

// Create the Express application: think of it as "the waiter".
const app = express();

// On Render the request first reaches Render's proxy, which forwards it to your app.
// Without this line every visitor would appear to have the proxy's IP address, and the
// rate limiter would count ALL users as one person. "1" = trust one proxy hop.
app.set("trust proxy", 1);

// MIDDLEWARE: functions that run on every request, IN THE ORDER WRITTEN. Order is behaviour.
app.use(helmet()); // 1) safety headers on every response (and removes X-Powered-By)
// 2) CORS: tells BROWSERS which front-end origin may read our responses.
//    It is NOT authentication: curl, Postman and Thunder Client ignore it.
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: "10kb" })); // 3) parse JSON bodies, and refuse anything bigger than 10 kb (413)

// Health check comes BEFORE the limiter, so uptime monitors never get blocked.
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api", apiLimiter); // 4) general rate limit for everything below

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes); // login required (see the routes file)
app.use("/api/stats", statsRoutes); // public, anonymous totals

// ORDER MATTERS: these two must come AFTER all routes.
app.use(notFound);
app.use(errorHandler);

// Export the app so server.js (and the tests) can use it. app.js never calls listen().
export default app;
