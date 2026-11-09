import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

export async function register(req, res) {
    // req.valid has already been validated and cleaned by the validate middleware.
    const { name, email, password, role, organization } = req.valid;

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ message: "That email is already registered" }); // 409 = conflict
    }

    // We list fields one by one (never User.create(req.body)): see "mass assignment".
    const user = await User.create({ name, email, password, role, organization });

    // 201 = Created. user is converted to JSON without the password (see toJSON in the model).
    res.status(201).json({ token: generateToken(user), user });
}

export async function login(req, res) {
    const { email, password } = req.valid;

    // password has select:false, so we must ask for it explicitly with +password.
    const user = await User.findOne({ email }).select("+password");

    // SAME message whether the email or the password was wrong,
    // so attackers can't use the message to discover which emails exist.
    const passwordMatches = user && (await user.comparePassword(password));
    if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: generateToken(user), user });
}

// "Who am I?" The front end calls this on page load to confirm its saved token is still valid.
export async function getMe(req, res) {
    const user = await User.findById(req.user.id);
    res.json({ user });
}
