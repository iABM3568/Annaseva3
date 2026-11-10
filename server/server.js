// This import MUST be first: it reads .env into process.env
// before any other file tries to use those values.
import "dotenv/config";
import http from "node:http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";

// Use the PORT from the environment (hosts like Render set it), otherwise 5000.
const PORT = process.env.PORT || 5000;

await connectDB(); // "await" works at the top level in ES modules

// Express alone can't speak WebSockets. We wrap it in a plain Node HTTP server,
// attach Socket.IO to that same server, and both share one port.
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
