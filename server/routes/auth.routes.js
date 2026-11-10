import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Read each line left to right: path, then the chain of checks, then the controller.
// authLimiter goes BEFORE validate and the controller, so blocked requests do no work.
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/me", protect, getMe);

export default router;
