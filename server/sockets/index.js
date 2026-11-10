import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io; // one Socket.IO server for the whole app, kept here so other files can reach it

export function initSocket(httpServer) {
    io = new Server(httpServer, {
        // Socket.IO has its OWN CORS settings, separate from Express's cors().
        cors: { origin: process.env.CLIENT_URL },
    });

    // SOCKET MIDDLEWARE: runs once per connection attempt. This is `protect` for sockets.
    io.use(async (socket, next) => {
        try {
            // The client sends its token in the handshake: io(url, { auth: { token } })
            const token = socket.handshake.auth?.token;
            const payload = jwt.verify(token, process.env.JWT_SECRET); // throws if missing/invalid/expired

            const user = await User.findById(payload.id).select("role");
            if (!user) return next(new Error("Unauthorized"));

            socket.data.user = { id: user._id.toString(), role: user.role }; // remember who this socket is
            next(); // allow the connection
        } catch {
            next(new Error("Unauthorized")); // reject the connection
        }
    });

    io.on("connection", (socket) => {
        const { id, role } = socket.data.user;

        socket.join(`user:${id}`); // a private room per user (works across multiple tabs)
        if (role === "ngo") socket.join("ngos"); // all NGOs share one room
    });

    return io;
}

// Other files call this to get the server. May be undefined in tests (no sockets started).
export function getIO() {
    return io;
}
