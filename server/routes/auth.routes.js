import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../validators/auth.schema.js";

const router = Router();

// Read each line left to right: path, then the chain of checks, then the controller.
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, getMe);

export default router;
