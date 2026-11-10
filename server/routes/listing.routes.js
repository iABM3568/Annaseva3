import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createListingSchema, nearbySchema } from "../validators/listing.schema.js";
import { createListing, getMyListings, getNearby, getMyClaims } from "../controllers/listing.controller.js";

const router = Router();

router.use(protect); // EVERY route in this file requires a valid login

router.post("/", restrictTo("donor"), validate(createListingSchema), createListing);
router.get("/mine", restrictTo("donor"), getMyListings);
router.get("/nearby", restrictTo("ngo"), validate(nearbySchema, "query"), getNearby);
router.get("/claimed", restrictTo("ngo"), getMyClaims);

export default router;
