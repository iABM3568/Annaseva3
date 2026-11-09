import jwt from "jsonwebtoken";
import User from "../models/User.js";

// protect = "the door check": are you logged in with a valid token?
export async function protect(req, res, next) {
    // The client sends:  Authorization: Bearer <token>
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Please log in" });
    }

    try {
        // jwt.verify checks the signature AND the expiry. It throws if either is wrong.
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Confirm the user still exists (they might have been deleted since the token was issued).
        const user = await User.findById(payload.id);
        if (!user) return res.status(401).json({ message: "This account no longer exists" });

        // Attach the identity to the request so later middleware/controllers can use it.
        req.user = { id: user._id.toString(), role: user.role, name: user.name };
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

// restrictTo('donor') = "the VIP list": only these roles may continue.
// Must run AFTER protect, because it needs req.user.
export const restrictTo =
    (...allowedRoles) =>
    (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "You are not allowed to do this" }); // 403 = known user, no permission
        }
        next();
    };
