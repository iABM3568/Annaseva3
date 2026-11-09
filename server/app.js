import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { notFound, errorHandler } from "./middleware/error.js";

// Create the Express application: think of it as "the waiter".
const app = express();

// MIDDLEWARE: functions that run on every request, in the order written.
// 1) CORS: tells BROWSERS which front-end origin may read our responses.
//    It is NOT authentication: curl, Postman and Thunder Client ignore it.
app.use(cors({ origin: process.env.CLIENT_URL }));
// 2) JSON parser: turns the JSON text in a request into a JavaScript object at req.body.
app.use(express.json());

// ROUTE: when someone sends GET /api/health, run this function.
app.get("/api/health", (req, res) => {
    // status(200) = "OK". json() sends the object back as JSON.
    res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// Everything under /api/auth is handled by authRoutes.
app.use("/api/auth", authRoutes);

// ORDER MATTERS: these two must come AFTER all routes.
app.use(notFound);
app.use(errorHandler);

// Export the app so server.js (and later, tests) can use it.
export default app;
