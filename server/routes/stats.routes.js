import { Router } from "express";
import { getStats } from "../controllers/stats.controller.js";

const router = Router();

// Public on purpose: no protect() here. The numbers are anonymous totals.
router.get("/", getStats);

export default router;
