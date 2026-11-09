import jwt from "jsonwebtoken";

// Creates the "wristband". The payload holds only what the server needs to recognise the user.
export function generateToken(user) {
    return jwt.sign(
        { id: user._id.toString(), role: user.role }, // payload: readable by anyone, so NO secrets here
        process.env.JWT_SECRET, // the signing key: the signature proves it wasn't altered
        { expiresIn: "7d" } // after 7 days the token stops working
    );
}
