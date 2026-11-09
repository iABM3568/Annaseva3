// Runs when no route matched.
export function notFound(req, res) {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express recognises an error handler by its FOUR parameters. Keep all four, even if
// `next` is unused. Must be registered LAST in app.js.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    // Errors raised by Express itself (malformed JSON, a body that is too large) carry a
    // status code in the 4xx range. Those are the CLIENT's mistake, not a server bug, so
    // pass them through instead of answering "500".
    const status = err.status ?? err.statusCode;
    if (status >= 400 && status < 500) {
        return res.status(status).json({
            message: status === 413 ? "Request body too large" : "Invalid request body",
        });
    }

    console.error(err); // log the real error on the server for YOU to read

    // Translate known database errors into friendly client errors.
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
        return res.status(400).json({ message });
    }
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid id format" });
    if (err.code === 11000) return res.status(409).json({ message: "That value already exists" });

    // Anything else is OUR bug. Send a vague message so internals never leak to users.
    res.status(500).json({ message: "Something went wrong on the server" });
}
