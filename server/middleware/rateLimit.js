import rateLimit from "express-rate-limit";

// The JSON body sent along with a 429 ("Too Many Requests") response.
// It uses the same { message } shape as every other error, so the React app can show it.
const tooMany = { message: "Too many requests. Please wait a few minutes and try again." };

// GENERAL limit for the whole API. Generous: it only exists to stop floods and runaway loops.
// The number can be raised from the environment (handy when a whole room uses one Wi-Fi at a demo).
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // the "window": 15 minutes
    limit: Number(process.env.RATE_LIMIT_MAX) || 1000, // max requests per IP per window
    standardHeaders: true, // send RateLimit-* headers so clients can see their budget
    legacyHeaders: false, // skip the old X-RateLimit-* headers
    message: tooMany,
});

// STRICT limit for register and login: slows down password guessing.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true, // only FAILED attempts (status 400 and up) use up the budget
    standardHeaders: true,
    legacyHeaders: false,
    message: tooMany,
});
