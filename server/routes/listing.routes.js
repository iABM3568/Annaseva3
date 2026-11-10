import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { validateId } from "../middleware/validateId.js";
import { createListingSchema, nearbySchema } from "../validators/listing.schema.js";
import {
    createListing,
    getMyListings,
    getNearby,
    getMyClaims,
    claimListing,
    completeListing,
    cancelListing,
} from "../controllers/listing.controller.js";

const router = Router();

router.use(protect); // EVERY route in this file requires a valid login

router.post("/", restrictTo("donor"), validate(createListingSchema), createListing);
router.get("/mine", restrictTo("donor"), getMyListings);
router.get("/nearby", restrictTo("ngo"), validate(nearbySchema, "query"), getNearby);
router.get("/claimed", restrictTo("ngo"), getMyClaims);

// State changes. validateId turns a garbage id into a clean 400 instead of a 500.
router.patch("/:id/claim", restrictTo("ngo"), validateId, claimListing);
router.patch("/:id/complete", restrictTo("donor"), validateId, completeListing);
router.patch("/:id/cancel", restrictTo("donor"), validateId, cancelListing);

export default router;
